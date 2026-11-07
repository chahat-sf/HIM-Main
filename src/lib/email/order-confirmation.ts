import {
	formatBusinessFooterLine,
	getBusinessProfile,
} from "@/lib/business";
import { getSiteUrl } from "@/lib/site-url";

export type OrderEmailItem = {
	name: string;
	color: string;
	size: string;
	qty: number;
	/** Unit price in paise. */
	unitPriceCents: number;
	/** Absolute or site-relative image path. */
	image: string;
};

export type OrderEmailData = {
	orderNumber: string;
	placedAt: Date;
	currency: string;
	subtotalCents: number;
	taxCents: number;
	totalCents: number;
	items: OrderEmailItem[];
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	/** Shipping address lines, already ordered top to bottom. */
	addressLines: string[];
	/** Razorpay payment id, when the order is paid. */
	paymentId: string;
};

/** Optional CID map so images travel with the email (works even when Gmail blocks remote images). */
export type OrderEmailCids = {
	hero?: string;
	logo?: string;
	instagram?: string;
	whatsapp?: string;
	youtube?: string;
	/** Parallel to data.items — cid or empty. */
	items?: (string | undefined)[];
};

const BRAND = {
	bg: "#f9f6f1",
	ink: "#1a1210",
	muted: "#8a8178",
	line: "#d9d3ca",
	button: "#1e1210",
};

const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const SANS = "Jost,'Helvetica Neue',Helvetica,Arial,sans-serif";

function infoBlock(title: string, lines: string[]): string {
	const body = lines
		.filter(Boolean)
		.map(
			(l) =>
				`<div style="font-size:13px;line-height:20px;color:${BRAND.ink};">${esc(l)}</div>`,
		)
		.join("");
	return `<div style="font-size:11px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:${BRAND.ink};margin-bottom:10px;">${title}</div>${body}`;
}

export function siteUrl(): string {
	return getSiteUrl();
}

function absolute(path: string): string {
	if (!path) return "";
	if (/^https?:\/\//i.test(path)) return path;
	return `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

function imgSrc(cid: string | undefined, fallbackUrl: string): string {
	if (cid) return `cid:${cid}`;
	return fallbackUrl;
}

function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function money(cents: number, currency: string): string {
	const amount = cents / 100;
	const formatted = new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency,
		maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
	}).format(amount);
	return formatted;
}

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	});
}

function itemRow(
	item: OrderEmailItem,
	currency: string,
	imageCid?: string,
): string {
	const detail = (label: string, value: string) =>
		value
			? `<div style="font-size:15px;line-height:24px;color:${BRAND.muted};">${label}: ${esc(value)}</div>`
			: "";
	const src = item.image
		? imgSrc(imageCid, absolute(item.image))
		: "";
	const img = src
		? `<img src="${esc(src)}" width="170" alt="${esc(item.name)}" style="display:block;width:170px;border-radius:14px;border:0;">`
		: "";
	return `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="170" valign="top" style="padding-right:24px;">${img}</td>
        <td valign="top">
          <div style="font-family:${SERIF};font-size:24px;letter-spacing:.5px;text-transform:uppercase;color:${BRAND.ink};">${esc(item.name)}</div>
          <div style="height:10px;"></div>
          ${detail("Color", item.color)}
          ${detail("Size", item.size)}
          ${detail("Quantity", String(item.qty))}
        </td>
        <td valign="top" align="right" style="font-family:${SERIF};font-size:22px;color:${BRAND.ink};white-space:nowrap;">${money(item.unitPriceCents * item.qty, currency)}</td>
      </tr>
    </table>
  </td>
</tr>`;
}

function totalRow(label: string, value: string, big = false): string {
	const size = big ? "30px" : "19px";
	return `
<tr>
  <td style="padding:4px 0;font-family:${SERIF};font-size:${size};color:${BRAND.ink};">${label}</td>
  <td align="right" style="padding:4px 0;font-family:${SERIF};font-size:${size};color:${BRAND.ink};">${value}</td>
</tr>`;
}

export function orderConfirmationSubject(data: OrderEmailData): string {
	return `Your HIM order #${data.orderNumber} is placed — tax invoice attached`;
}

export function renderOrderConfirmationEmail(
	data: OrderEmailData,
	cids: OrderEmailCids = {},
): string {
	const base = siteUrl();
	const heroUrl = imgSrc(cids.hero, `${base}/homepage/3-man-image.webp`);
	const logoUrl = imgSrc(cids.logo, `${base}/email/him-logo.png`);
	const instagram =
		process.env.SOCIAL_INSTAGRAM_URL || "https://www.instagram.com/itshimworld";
	const whatsapp = process.env.SOCIAL_WHATSAPP_URL || "";
	const youtube = process.env.SOCIAL_YOUTUBE_URL || "";
	const social = [
		["Instagram", cids.instagram, "instagram", instagram],
		["WhatsApp", cids.whatsapp, "whatsapp", whatsapp],
		["YouTube", cids.youtube, "youtube", youtube],
	]
		.filter((entry) => Boolean(entry[3]))
		.map(([label, cid, icon, href]) => {
			const src = imgSrc(
				cid as string | undefined,
				`${base}/email/${icon}.png`,
			);
			return `<a href="${esc(String(href))}" style="text-decoration:none;margin-left:18px;"><img src="${esc(src)}" width="24" height="24" alt="${label}" style="border:0;vertical-align:middle;"></a>`;
		})
		.join("");

	const rows = data.items
		.map((item, index) =>
			itemRow(item, data.currency, cids.items?.[index]),
		)
		.join("");
	const tax =
		data.taxCents > 0
			? totalRow("GST (18%)", money(data.taxCents, data.currency))
			: "";

	const legalLink = (label: string, path: string) =>
		`<a href="${base}${path}" style="color:${BRAND.ink};text-decoration:none;">${label}</a>`;
	const legalLinks = [
		legalLink("Terms", "/terms-of-sale"),
		legalLink("Privacy", "/privacy-policy"),
		legalLink("Shipping", "/terms-of-sale"),
		legalLink("Returns &amp; Cancellation", "/terms-of-sale"),
		legalLink("Grievance Officer", "/legals"),
	].join(`<span style="color:${BRAND.muted};">&nbsp;&middot;&nbsp;</span>`);
	const businessLine = formatBusinessFooterLine(getBusinessProfile());

	const fitText = (text: string, first = false) =>
		`<p style="margin:${first ? "18px" : "14px"} 0 0;font-size:15px;line-height:24px;color:${BRAND.ink};">${text}</p>`;

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(orderConfirmationSubject(data))}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Jost:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${BRAND.bg};">
  <tr><td style="font-size:0;line-height:0;"><img src="${esc(heroUrl)}" width="600" alt="HIM" style="display:block;width:100%;height:auto;border:0;"></td></tr>
  <tr><td align="center" style="padding:32px 24px 0;font-family:${SANS};">
    <div style="font-size:14px;letter-spacing:3px;color:${BRAND.muted};text-transform:uppercase;">Order placed</div>
    <h1 style="margin:18px 0 0;font-family:${SERIF};font-weight:500;font-size:46px;line-height:50px;color:${BRAND.ink};">Your order is placed</h1>
    <p style="margin:20px 0 0;font-size:16px;line-height:22px;color:${BRAND.ink};">Your payment has reached us, and your order is<br>now in our hands. Your tax invoice is attached as a PDF.<br>Here are the details:</p>
    <div style="margin-top:34px;font-size:17px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.ink};">Order No. #${esc(data.orderNumber)}</div>
    <div style="margin-top:6px;font-size:15px;color:${BRAND.muted};">${formatDate(data.placedAt)}</div>
    <div style="margin-top:26px;">
      <a href="${base}/account" style="display:inline-block;background:${BRAND.button};color:#ffffff;text-decoration:none;font-size:14px;letter-spacing:2.5px;text-transform:uppercase;padding:19px 46px;border-radius:40px;">View your order &rarr;</a>
    </div>
  </td></tr>
  <tr><td align="center" style="padding:52px 40px 0;font-family:${SANS};">
    <div style="font-family:${SERIF};font-size:32px;line-height:38px;color:${BRAND.ink};">Now, the fit.</div>
    ${fitText("You’ve shared your usual size. Good.<br>That’s where we begin, not where we stop.", true)}
    ${fitText("Our team will personally reach out to you to take your<br>measurements and understand how you like to wear what you wear.<br>Every piece is made to sit the way it should on you. No more, no less.")}
    ${fitText("Keep your phone close. We’ll be in touch soon.")}
  </td></tr>
  <tr><td style="padding:40px 36px 0;font-family:${SANS};">
    <div style="border-top:1px solid ${BRAND.line};height:1px;line-height:1px;font-size:0;">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;padding-top:8px;">
      ${totalRow("Taxable value", money(data.subtotalCents, data.currency))}
      ${tax}
      ${totalRow("Shipping", "Free")}
      <tr><td colspan="2" style="height:6px;"></td></tr>
      ${totalRow("Total", money(data.totalCents, data.currency), true)}
    </table>
    <div style="margin-top:4px;font-size:11px;color:${BRAND.muted};">Inclusive of 18% GST</div>
    <div style="margin-top:26px;border-top:1px solid ${BRAND.line};height:1px;line-height:1px;font-size:0;">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
      <tr>
        <td width="50%" valign="top">${infoBlock("Delivery address", [data.customerName, ...data.addressLines])}</td>
        <td width="50%" valign="top">${infoBlock("Your details", [data.customerName, data.customerEmail, data.customerPhone])}</td>
      </tr>
      <tr><td colspan="2" style="height:28px;"></td></tr>
      <tr>
        <td width="50%" valign="top">${infoBlock("Delivery", ["Standard delivery · Free", "Timeline shared after your fit call"])}</td>
        <td width="50%" valign="top">${infoBlock("Payment", ["Paid online", data.paymentId ? `Transaction ID: ${data.paymentId}` : ""])}</td>
      </tr>
    </table>
    <div style="margin-top:30px;border-top:1px solid ${BRAND.line};height:1px;line-height:1px;font-size:0;">&nbsp;</div>
  </td></tr>
  <tr><td align="center" style="padding:30px 40px 0;font-family:${SANS};">
    <div style="font-family:${SERIF};font-size:30px;line-height:36px;color:${BRAND.ink};">Returns &amp; exchanges</div>
    <p style="margin:12px 0 0;font-size:14px;line-height:22px;color:${BRAND.ink};">Ready-to-wear and made-to-measure pieces follow different terms.<br>The full details are on our policy page.</p>
    <div style="margin-top:22px;">
      <a href="${base}/terms-of-sale" style="display:inline-block;color:${BRAND.ink};text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:14px 38px;border:1px solid ${BRAND.ink};border-radius:40px;">View policy</a>
    </div>
    <div style="margin:30px 0 0;border-top:1px solid ${BRAND.line};height:1px;line-height:1px;font-size:0;">&nbsp;</div>
  </td></tr>
  <tr><td align="center" style="padding:24px 28px 0;font-family:${SANS};">
    <div style="font-size:14px;line-height:20px;color:${BRAND.ink};">Questions before we call? Simply reply to this email.</div>
    <div style="margin-top:22px;font-family:${SERIF};font-size:26px;color:${BRAND.ink};">It’s just him.</div>
    <div style="margin-top:8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.muted};">Team HIM</div>
  </td></tr>
  <tr><td style="padding:36px 36px 36px;font-family:${SANS};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td><a href="${base}"><img src="${esc(logoUrl)}" width="90" alt="him" style="display:block;border:0;"></a></td>
        <td align="right">${social}</td>
      </tr>
    </table>
    <div style="margin-top:26px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;line-height:16px;">${legalLinks}</div>
    <div style="margin-top:14px;text-align:center;font-size:10px;line-height:16px;color:${BRAND.muted};">HIM never asks for payment through links on WhatsApp, SMS or email. Pay only on ${esc(base.replace(/^https?:\/\//, ""))}, and disregard any unusual payment request.</div>
    <div style="margin-top:12px;text-align:center;font-size:10px;line-height:16px;color:${BRAND.muted};">${esc(businessLine)}</div>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
