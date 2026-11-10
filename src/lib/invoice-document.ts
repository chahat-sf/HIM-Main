import type { BusinessProfile, GstBreakup } from "@/lib/business";

export type InvoiceLineInput = {
	name: string;
	size: string;
	color: string;
	qty: number;
	unitPriceCents: number;
};

/** Cropped dark logo for light invoice / PDF / email backgrounds. */
export const INVOICE_LOGO_PATH = "/homepage/him-logo-dark.png";

export type InvoiceDocumentModel = {
	invoiceNumber: string;
	orderNumber: string;
	placedAtLabel: string;
	currency: string;
	subtotalCents: number;
	taxCents: number;
	totalCents: number;
	paymentId: string | null;
	business: BusinessProfile;
	gst: GstBreakup;
	billTo: string[];
	items: InvoiceLineInput[];
	/**
	 * Logo image src. Web pages use the public path; PDF embeds a data URI
	 * so Chromium can render without network access.
	 */
	logoSrc?: string;
};

export function formatInvoiceMoney(cents: number, currency = "INR"): string {
	if (currency === "INR") {
		return `₹ ${(cents / 100).toLocaleString("en-IN", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;
	}
	return `${(cents / 100).toFixed(2)} ${currency}`;
}

export function formatInvoiceDate(
	value: Date | string | null | undefined,
): string {
	if (!value) return "—";
	try {
		const date = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(date.getTime())) return "—";
		return date.toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	} catch {
		return "—";
	}
}

export function invoiceLineAmounts(
	item: InvoiceLineInput,
	taxCents: number,
	totalCents: number,
): { lineIncl: number; lineTax: number; lineTaxable: number } {
	const lineIncl = item.unitPriceCents * item.qty;
	const lineTax = Math.round((lineIncl * taxCents) / Math.max(totalCents, 1));
	return {
		lineIncl,
		lineTax,
		lineTaxable: lineIncl - lineTax,
	};
}

/** CSS shared by the web invoice page and the Chromium PDF HTML. */
export const INVOICE_SHEET_CSS = `
.inv-sheet {
	max-width: 860px;
	margin: 0 auto;
	background: #fff;
	padding: 40px 36px;
	border: 1px solid #ddd;
	color: #111;
	font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
	box-sizing: border-box;
}
.inv-logo-wrap {
	display: flex;
	justify-content: center;
	margin: 0 0 28px;
}
.inv-logo {
	display: block;
	width: 88px;
	height: auto;
}
.inv-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 24px;
	flex-wrap: wrap;
	margin-bottom: 28px;
	padding-bottom: 24px;
	border-bottom: 1px solid #e5e5e5;
}
.inv-doc-label {
	margin: 0 0 6px;
	font-size: 11px;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: #666;
}
.inv-brand {
	margin: 0 0 6px;
	font-family: Georgia, "Cormorant Garamond", serif;
	font-size: 26px;
}
.inv-biz-meta {
	margin: 0;
	font-size: 12px;
	line-height: 1.5;
	color: #444;
}
.inv-meta {
	margin-left: auto;
	align-self: flex-end;
}
.inv-meta p {
	margin: 0 0 6px;
	font-size: 13px;
}
.inv-parties {
	margin-bottom: 24px;
}
.inv-billto h2 {
	margin: 0 0 8px;
	font-size: 11px;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: #666;
}
.inv-billto p {
	margin: 0;
	font-size: 13px;
	line-height: 1.45;
}
.inv-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 12px;
}
.inv-table th,
.inv-table td {
	padding: 10px 6px;
	border-bottom: 1px solid #eee;
	text-align: left;
	vertical-align: top;
}
.inv-table th {
	font-size: 10px;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: #666;
	font-weight: 600;
}
.inv-table .num {
	text-align: right;
	white-space: nowrap;
}
.inv-totals {
	margin-top: 20px;
	margin-left: auto;
	max-width: 340px;
	display: grid;
	gap: 8px;
	font-size: 13px;
}
.inv-totals > div {
	display: flex;
	justify-content: space-between;
	gap: 16px;
}
.inv-grand {
	margin-top: 6px;
	padding-top: 10px;
	border-top: 1px solid #111;
	font-weight: 600;
}
.inv-incl-note {
	margin: 4px 0 0;
	font-size: 11px;
	color: #666;
	text-align: right;
}
.inv-foot {
	margin-top: 36px;
	padding-top: 16px;
	border-top: 1px solid #eee;
	font-size: 11px;
	color: #666;
	line-height: 1.5;
}
.inv-foot p {
	margin: 0 0 6px;
}
`;

export const INVOICE_PAGE_CSS = `
.inv-page {
	min-height: 100vh;
	background: #f4f2ef;
	color: #111;
	font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
	padding: 24px 16px 48px;
}
.inv-toolbar {
	max-width: 860px;
	margin: 0 auto 16px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
}
.inv-email-bar {
	max-width: 860px;
	margin: 0 auto 16px;
	background: #fff;
	border: 1px solid #ddd;
	padding: 4px 20px 16px;
}
.inv-toolbar a {
	color: #333;
	font-size: 13px;
	text-decoration: none;
}
.inv-print-btn {
	appearance: none;
	border: none;
	background: #c4a574;
	color: #111;
	font-size: 12px;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	padding: 12px 18px;
	cursor: pointer;
}
@media print {
	.inv-page {
		background: #fff;
		padding: 0;
	}
	.no-print {
		display: none !important;
	}
	.inv-sheet {
		border: none;
		padding: 0;
		max-width: none;
	}
}
`;

function escHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * Pure HTML for the invoice sheet (no react-dom/server — App Route safe).
 * Keep in sync with TaxInvoiceDocument.tsx.
 */
export function renderInvoiceSheetHtml(model: InvoiceDocumentModel): string {
	const {
		invoiceNumber,
		orderNumber,
		placedAtLabel,
		currency,
		subtotalCents,
		taxCents,
		totalCents,
		paymentId,
		business,
		gst,
		billTo,
		items,
		logoSrc = INVOICE_LOGO_PATH,
	} = model;

	const addressMeta = business.addressLines
		.map((line) => `<p class="inv-biz-meta">${escHtml(line)}</p>`)
		.join("");
	const billToHtml = billTo.map((line) => `<p>${escHtml(line)}</p>`).join("");
	const rows = items
		.map((item) => {
			const { lineIncl, lineTax, lineTaxable } = invoiceLineAmounts(
				item,
				taxCents,
				totalCents,
			);
			const details =
				[item.size, item.color].filter(Boolean).join(" · ") || "—";
			return `<tr>
  <td>${escHtml(item.name)}</td>
  <td>—</td>
  <td>${escHtml(details)}</td>
  <td class="num">${item.qty}</td>
  <td class="num">${escHtml(formatInvoiceMoney(lineTaxable, currency))}</td>
  <td class="num">${escHtml(formatInvoiceMoney(lineTax, currency))}</td>
  <td class="num">${escHtml(formatInvoiceMoney(lineIncl, currency))}</td>
</tr>`;
		})
		.join("");

	const taxRows =
		gst.mode === "intra"
			? `<div><span>CGST (9%)</span><span>${escHtml(formatInvoiceMoney(gst.cgstCents, currency))}</span></div>
<div><span>SGST (9%)</span><span>${escHtml(formatInvoiceMoney(gst.sgstCents, currency))}</span></div>`
			: `<div><span>IGST (18%)</span><span>${escHtml(formatInvoiceMoney(gst.igstCents, currency))}</span></div>`;

	const paymentRow = paymentId
		? `<p><strong>Payment ref</strong> ${escHtml(paymentId)}</p>`
		: "";

	const logoHtml = logoSrc
		? `<div class="inv-logo-wrap"><img class="inv-logo" src="${escHtml(logoSrc)}" width="88" alt="HIM" /></div>`
		: "";

	return `<article class="inv-sheet">
  ${logoHtml}
  <header class="inv-header">
    <div class="inv-supplier">
      <p class="inv-doc-label">Tax invoice</p>
      <p class="inv-brand">${escHtml(business.tradeName)}</p>
      <p class="inv-biz-meta">${escHtml(business.legalName)}</p>
      ${addressMeta}
      <p class="inv-biz-meta">State: ${escHtml(business.state)} (${escHtml(business.stateCode)})</p>
      <p class="inv-biz-meta"><strong>GSTIN:</strong> ${escHtml(business.gstin)}</p>
      <p class="inv-biz-meta"><strong>PAN:</strong> ${escHtml(business.pan)}</p>
    </div>
    <div class="inv-meta">
      <p><strong>Invoice no.</strong> ${escHtml(invoiceNumber)}</p>
      <p><strong>Order ID</strong> #${escHtml(orderNumber)}</p>
      <p><strong>Invoice date</strong> ${escHtml(placedAtLabel)}</p>
      <p><strong>Place of supply</strong> ${escHtml(gst.placeOfSupply)} (${escHtml(gst.placeOfSupplyCode)})</p>
      <p><strong>Reverse charge</strong> No</p>
      ${paymentRow}
    </div>
  </header>
  <section class="inv-parties">
    <div class="inv-billto">
      <h2>Bill to / Ship to</h2>
      ${billToHtml}
      <p class="inv-biz-meta">Recipient GSTIN: Unregistered (B2C)</p>
    </div>
  </section>
  <table class="inv-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>HSN/SAC</th>
        <th>Details</th>
        <th class="num">Qty</th>
        <th class="num">Taxable</th>
        <th class="num">Tax</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="inv-totals">
    <div><span>Taxable value</span><span>${escHtml(formatInvoiceMoney(subtotalCents, currency))}</span></div>
    <div><span>Shipping</span><span>Free</span></div>
    ${taxRows}
    <div class="inv-grand"><span>Total invoice value</span><span>${escHtml(formatInvoiceMoney(totalCents, currency))}</span></div>
    <p class="inv-incl-note">Prices are inclusive of 18% GST</p>
  </div>
  <footer class="inv-foot">
    <p>This is a computer-generated tax invoice under the CGST / SGST / IGST Acts and does not require a physical signature.</p>
    <p>Supplier: ${escHtml(business.legalName)} · GSTIN ${escHtml(business.gstin)} · ${escHtml(business.constitution)}</p>
    <p>For support, quote invoice ${escHtml(invoiceNumber)} / order #${escHtml(orderNumber)}.</p>
  </footer>
</article>`;
}

/** Full HTML document for Chromium PDF printing. */
export function buildInvoicePdfHtmlDocument(
	model: InvoiceDocumentModel,
): string {
	const body = renderInvoiceSheetHtml(model);
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tax invoice ${escHtml(model.invoiceNumber)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111;
  }
  ${INVOICE_SHEET_CSS}
  .inv-sheet {
    max-width: none;
    margin: 0;
    border: none;
    padding: 0;
  }
</style>
</head>
<body>${body}</body>
</html>`;
}
