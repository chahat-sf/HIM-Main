import { promises as fs } from "fs";
import path from "path";
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";
import { getBusinessProfile, splitGstForPlaceOfSupply } from "@/lib/business";
import {
	buildInvoicePdfHtmlDocument,
	formatInvoiceDate,
	INVOICE_LOGO_PATH,
	type InvoiceDocumentModel,
} from "@/lib/invoice-document";
import type { OrderEmailData } from "@/lib/email/order-confirmation";

export type InvoicePdfData = OrderEmailData & {
	/** Buyer state from address_snapshot — drives CGST+SGST vs IGST. */
	buyerState: string | null;
};

async function invoiceLogoDataUri(): Promise<string | undefined> {
	const rel = INVOICE_LOGO_PATH.replace(/^\/+/, "");
	try {
		const buf = await fs.readFile(path.join(process.cwd(), "public", rel));
		return `data:image/png;base64,${buf.toString("base64")}`;
	} catch {
		return undefined;
	}
}

async function toDocumentModel(
	data: InvoicePdfData,
): Promise<InvoiceDocumentModel> {
	const business = getBusinessProfile();
	const gst = splitGstForPlaceOfSupply(
		data.taxCents,
		data.buyerState,
		business,
	);
	const billTo = [
		data.customerName,
		...data.addressLines,
		data.customerEmail,
		data.customerPhone,
	].filter((line) => Boolean(line && String(line).trim()));

	return {
		invoiceNumber: `INV-${data.orderNumber}`,
		orderNumber: data.orderNumber,
		placedAtLabel: formatInvoiceDate(data.placedAt),
		currency: data.currency,
		subtotalCents: data.subtotalCents,
		taxCents: data.taxCents,
		totalCents: data.totalCents,
		paymentId: data.paymentId || null,
		business,
		gst,
		billTo,
		logoSrc: (await invoiceLogoDataUri()) || INVOICE_LOGO_PATH,
		items: data.items.map((item) => ({
			name: item.name,
			size: item.size,
			color: item.color,
			qty: item.qty,
			unitPriceCents: item.unitPriceCents,
		})),
	};
}

function localChromePath(): string | null {
	if (process.platform === "darwin") {
		return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
	}
	if (process.platform === "win32") {
		return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
	}
	return null;
}

async function launchBrowser(): Promise<Browser> {
	const envPath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
	const useServerlessChromium =
		Boolean(process.env.VERCEL) ||
		Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

	if (useServerlessChromium) {
		return puppeteer.launch({
			args: chromium.args,
			defaultViewport: {
				width: 1200,
				height: 1600,
				deviceScaleFactor: 1,
			},
			executablePath: envPath || (await chromium.executablePath()),
			headless: true,
		});
	}

	const executablePath = envPath || localChromePath() || undefined;
	return puppeteer.launch({
		args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
		defaultViewport: { width: 1200, height: 1600, deviceScaleFactor: 1 },
		executablePath,
		channel: executablePath ? undefined : "chrome",
		headless: true,
		timeout: 60_000,
	});
}

/**
 * Build a tax-invoice PDF that matches the browser invoice page.
 * Renders shared invoice HTML via Chromium (no react-dom/server).
 */
export async function buildInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
	const model = await toDocumentModel(data);
	const html = buildInvoicePdfHtmlDocument(model);

	let browser: Browser | null = null;
	try {
		browser = await launchBrowser();
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: "load" });
		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			preferCSSPageSize: true,
			margin: {
				top: "14mm",
				right: "14mm",
				bottom: "14mm",
				left: "14mm",
			},
		});
		return Buffer.from(pdf);
	} finally {
		if (browser) {
			await browser.close().catch(() => undefined);
		}
	}
}
