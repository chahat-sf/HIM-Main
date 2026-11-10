import nodemailer, { type Transporter } from "nodemailer";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import {
	emailProductImagePath,
	loadEmailAsset,
	type EmailInlineAttachment,
} from "@/lib/email/assets";
import { buildInvoicePdf } from "@/lib/email/invoice-pdf";
import {
	orderConfirmationSubject,
	renderOrderConfirmationEmail,
	type OrderEmailCids,
	type OrderEmailData,
} from "@/lib/email/order-confirmation";
import { renderSignupOtpEmail, signupOtpSubject } from "@/lib/email/signup-otp";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
	if (transporter) return transporter;
	const host = process.env.SMTP_HOST;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	if (!host || !user || !pass) return null;
	const port = Number(process.env.SMTP_PORT) || 587;
	transporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass },
	});
	return transporter;
}

type OrderEmailPayload = OrderEmailData & {
	to: string;
	/** Buyer state from address_snapshot — used for PDF CGST/SGST vs IGST. */
	buyerState: string | null;
};

type MailAttachment = {
	filename: string;
	content: Buffer;
	contentType: string;
	cid?: string;
	contentDisposition?: "inline" | "attachment";
};

function asInline(asset: EmailInlineAttachment): MailAttachment {
	return {
		filename: asset.filename,
		content: asset.content,
		contentType: asset.contentType,
		cid: asset.cid,
		contentDisposition: "inline",
	};
}

/** Load order + line items (with catalog images) for the email. */
async function loadOrderEmailData(
	orderId: number,
): Promise<OrderEmailPayload | null> {
	const db = getDb();
	const [orders] = await db.query<RowDataPacket[]>(
		`SELECT o.order_number, o.currency, o.subtotal_cents, o.tax_cents,
            o.total_cents, o.placed_at, o.address_snapshot,
            o.razorpay_payment_id, u.email, u.full_name, u.phone
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = :orderId
     LIMIT 1`,
		{ orderId },
	);
	const order = orders?.[0];
	if (!order) return null;

	const [items] = await db.query<RowDataPacket[]>(
		`SELECT i.product_name, i.color, i.size, i.quantity, i.unit_price_cents,
            p.image_url
     FROM order_items i
     LEFT JOIN products p ON (
       (i.product_id IS NOT NULL AND p.id = i.product_id)
       OR (i.product_id IS NULL AND p.slug = i.product_slug)
     )
     WHERE i.order_id = :orderId
     ORDER BY i.id`,
		{ orderId },
	);

	let addr: Record<string, unknown> = {};
	try {
		const raw = order.address_snapshot;
		addr = typeof raw === "string" ? JSON.parse(raw) : (raw ?? {});
	} catch {
		addr = {};
	}
	const text = (v: unknown) => (v ? String(v) : "");
	const addressLines = [
		text(addr.line1),
		text(addr.line2),
		[text(addr.city), text(addr.state)].filter(Boolean).join(", "),
		[text(addr.postalCode), text(addr.country)].filter(Boolean).join(", "),
	].filter(Boolean);

	const buyerState = text(addr.state) || null;

	return {
		to: String(order.email),
		customerName: String(addr.fullName || order.full_name || ""),
		customerEmail: String(order.email),
		customerPhone: String(order.phone ?? ""),
		addressLines,
		buyerState,
		paymentId: String(order.razorpay_payment_id ?? ""),
		orderNumber: String(order.order_number),
		placedAt: order.placed_at ? new Date(order.placed_at) : new Date(),
		currency: String(order.currency || "INR"),
		subtotalCents: Number(order.subtotal_cents) || 0,
		taxCents: Number(order.tax_cents) || 0,
		totalCents: Number(order.total_cents) || 0,
		items: (items ?? []).map((row) => ({
			name: String(row.product_name),
			color: String(row.color ?? ""),
			size: String(row.size ?? ""),
			qty: Number(row.quantity) || 1,
			unitPriceCents: Number(row.unit_price_cents) || 0,
			image: emailProductImagePath(String(row.image_url ?? "")),
		})),
	};
}

async function buildOrderEmailAssets(
	data: OrderEmailData,
): Promise<{ cids: OrderEmailCids; attachments: MailAttachment[] }> {
	const attachments: MailAttachment[] = [];
	const cids: OrderEmailCids = { items: [] };

	const push = async (rel: string, cid: string) => {
		const asset = await loadEmailAsset(rel, cid);
		if (!asset) return undefined;
		attachments.push(asInline(asset));
		return cid;
	};

	cids.hero = await push("homepage/3-man-image.webp", "him-hero");
	cids.logo = await push("homepage/him-logo-dark.png", "him-logo");
	cids.instagram = await push("email/instagram.png", "him-instagram");
	if (process.env.SOCIAL_WHATSAPP_URL) {
		cids.whatsapp = await push("email/whatsapp.png", "him-whatsapp");
	}
	if (process.env.SOCIAL_YOUTUBE_URL) {
		cids.youtube = await push("email/youtube.png", "him-youtube");
	}

	for (let i = 0; i < data.items.length; i++) {
		const src = data.items[i]?.image;
		if (!src || /^https?:\/\//i.test(src)) {
			cids.items!.push(undefined);
			continue;
		}
		const cid = await push(src.replace(/^\/+/, ""), `him-item-${i}`);
		cids.items!.push(cid);
	}

	return { cids, attachments };
}

/** Send the signup code. Returns false when SMTP is missing or the send fails. */
export async function sendSignupOtpEmail(
	to: string,
	code: string,
): Promise<boolean> {
	const mailer = getTransporter();
	if (!mailer) {
		console.error("signup otp email skipped: SMTP_* env vars not configured");
		return false;
	}
	try {
		const logo = await loadEmailAsset("homepage/him-logo-dark.png", "him-logo");
		const attachments: MailAttachment[] = logo ? [asInline(logo)] : [];
		await mailer.sendMail({
			from: process.env.EMAIL_FROM || process.env.SMTP_USER,
			to,
			subject: signupOtpSubject(),
			html: renderSignupOtpEmail(code, {
				logo: logo ? "him-logo" : undefined,
			}),
			attachments,
		});
		return true;
	} catch (error) {
		const message = error instanceof Error ? error.message : "send failed";
		console.error("signup otp email failed", message);
		return false;
	}
}

export type SendOrderEmailResult =
	| { ok: true; to: string }
	| { ok: false; error: string };

/**
 * Send the order confirmation (+ PDF invoice) to the account email,
 * or to `toEmail` when provided (resend / alternate address).
 * Never throws: checkout must not break on mail failure.
 */
export async function sendOrderConfirmationEmail(
	orderId: number,
	toEmail?: string,
): Promise<SendOrderEmailResult> {
	try {
		const mailer = getTransporter();
		if (!mailer) {
			console.warn("order email skipped: SMTP_* env vars not configured");
			return { ok: false, error: "Email is not configured right now." };
		}
		const data = await loadOrderEmailData(orderId);
		if (!data) {
			return { ok: false, error: "Order not found." };
		}

		const to = (toEmail?.trim() || data.to).toLowerCase();
		if (!to) {
			return { ok: false, error: "A destination email is required." };
		}

		const attachments: MailAttachment[] = [];
		let cids: OrderEmailCids = {};
		try {
			const assets = await buildOrderEmailAssets(data);
			cids = assets.cids;
			attachments.push(...assets.attachments);
		} catch (assetError) {
			console.error("order email inline assets failed", assetError);
		}

		try {
			const pdf = await buildInvoicePdf(data);
			attachments.push({
				filename: `invoice-${data.orderNumber}.pdf`,
				content: pdf,
				contentType: "application/pdf",
				contentDisposition: "attachment",
			});
		} catch (pdfError) {
			console.error("invoice PDF build failed; sending HTML only", pdfError);
		}

		await mailer.sendMail({
			from: process.env.EMAIL_FROM || process.env.SMTP_USER,
			to,
			subject: orderConfirmationSubject(data),
			html: renderOrderConfirmationEmail(data, cids),
			attachments,
		});
		return { ok: true, to };
	} catch (error) {
		console.error("order confirmation email failed", error);
		return { ok: false, error: "Unable to send the email right now." };
	}
}
