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
};

const BRAND = {
	bg: "#f9f6f1",
	ink: "#1a1210",
	muted: "#8a8178",
	line: "#d9d3ca",
	button: "#1e1210",
};

export function siteUrl(): string {
	return (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function absolute(path: string): string {
	if (!path) return "";
	if (/^https?:\/\//i.test(path)) return path;
	return `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
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

function itemRow(item: OrderEmailItem, currency: string): string {
	const detail = (label: string, value: string) =>
		value
			? `<div style="font-size:15px;line-height:24px;color:${BRAND.muted};">${label}: ${esc(value)}</div>`
			: "";
	const img = item.image
		? `<img src="${esc(absolute(item.image))}" width="140" alt="${esc(item.name)}" style="display:block;width:140px;border-radius:14px;border:0;">`
		: "";
	return `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${BRAND.line};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="140" valign="top" style="padding-right:20px;">${img}</td>
        <td valign="top">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:.5px;text-transform:uppercase;color:${BRAND.ink};">${esc(item.name)}</div>
          <div style="height:10px;"></div>
          ${detail("Color", item.color)}
          ${detail("Size", item.size)}
          ${detail("Quantity", String(item.qty))}
        </td>
        <td valign="top" align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BRAND.ink};white-space:nowrap;">${money(item.unitPriceCents * item.qty, currency)}</td>
      </tr>
    </table>
  </td>
</tr>`;
}

function totalRow(label: string, value: string, big = false): string {
	const size = big ? "28px" : "18px";
	return `
<tr>
  <td style="padding:4px 0;font-family:Georgia,'Times New Roman',serif;font-size:${size};color:${BRAND.ink};">${label}</td>
  <td align="right" style="padding:4px 0;font-family:Georgia,'Times New Roman',serif;font-size:${size};color:${BRAND.ink};">${value}</td>
</tr>`;
}

export function orderConfirmationSubject(data: OrderEmailData): string {
	return `Your HIM order #${data.orderNumber} is confirmed`;
}

export function renderOrderConfirmationEmail(data: OrderEmailData): string {
	const base = siteUrl();
	const heroUrl = `${base}/homepage/3-man-image.webp`;
	const logoUrl = `${base}/homepage/him-logo.webp`;
	const instagram =
		process.env.SOCIAL_INSTAGRAM_URL || "https://www.instagram.com/itshimworld";
	const whatsapp = process.env.SOCIAL_WHATSAPP_URL || "";
	const youtube = process.env.SOCIAL_YOUTUBE_URL || "";
	const social = [
		["Instagram", instagram],
		["WhatsApp", whatsapp],
		["YouTube", youtube],
	]
		.filter(([, href]) => href)
		.map(
			([label, href]) =>
				`<a href="${esc(href)}" style="color:${BRAND.ink};text-decoration:none;margin-left:16px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">${label}</a>`,
		)
		.join("");

	const rows = data.items.map((i) => itemRow(i, data.currency)).join("");
	const tax =
		data.taxCents > 0
			? totalRow("Tax", money(data.taxCents, data.currency))
			: "";

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(orderConfirmationSubject(data))}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${BRAND.bg};">
  <tr><td style="font-size:0;line-height:0;"><img src="${esc(heroUrl)}" width="600" alt="HIM" style="display:block;width:100%;height:auto;border:0;"></td></tr>
  <tr><td align="center" style="padding:36px 24px 0;font-family:Helvetica,Arial,sans-serif;">
    <div style="font-size:14px;letter-spacing:3px;color:${BRAND.muted};text-transform:uppercase;">Order confirmed</div>
    <h1 style="margin:22px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:40px;line-height:46px;color:${BRAND.ink};">Your order is confirmed</h1>
    <p style="margin:20px 0 0;font-size:17px;line-height:26px;color:${BRAND.ink};">We'll let you know as soon as your order ships.<br>Here are the details:</p>
    <div style="margin-top:36px;font-size:17px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.ink};">Order No. #${esc(data.orderNumber)}</div>
    <div style="margin-top:6px;font-size:15px;color:${BRAND.muted};">${formatDate(data.placedAt)}</div>
    <div style="margin-top:28px;">
      <a href="${base}/account" style="display:inline-block;background:${BRAND.button};color:#ffffff;text-decoration:none;font-size:14px;letter-spacing:2.5px;text-transform:uppercase;padding:18px 44px;border-radius:40px;">View your order &rarr;</a>
    </div>
  </td></tr>
  <tr><td style="padding:40px 28px 0;font-family:Helvetica,Arial,sans-serif;">
    <div style="border-top:1px solid ${BRAND.line};height:1px;line-height:1px;font-size:0;">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border-top:1px solid ${BRAND.line};padding-top:12px;">
      ${totalRow("Subtotal", money(data.subtotalCents, data.currency))}
      ${tax}
      ${totalRow("Shipping", "Free")}
      <tr><td colspan="2" style="height:8px;"></td></tr>
      ${totalRow("Total", money(data.totalCents, data.currency), true)}
    </table>
  </td></tr>
  <tr><td style="padding:32px 28px 32px;">
    <div style="border-top:1px solid ${BRAND.line};height:1px;line-height:1px;font-size:0;">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;font-family:Helvetica,Arial,sans-serif;">
      <tr>
        <td><a href="${base}"><img src="${esc(logoUrl)}" width="90" alt="him" style="display:block;border:0;"></a></td>
        <td align="right">${social}</td>
      </tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
