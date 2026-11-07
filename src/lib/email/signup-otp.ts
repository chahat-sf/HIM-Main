import {
	formatBusinessFooterLine,
	getBusinessProfile,
} from "@/lib/business";
import { siteUrl } from "@/lib/email/order-confirmation";

const BRAND = {
	bg: "#f9f6f1",
	ink: "#1a1210",
	muted: "#8a8178",
	line: "#d9d3ca",
};

const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const SANS = "Jost,'Helvetica Neue',Helvetica,Arial,sans-serif";

function esc(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function signupOtpSubject(): string {
	return "Your HIM verification code";
}

export function renderSignupOtpEmail(
	code: string,
	cids: { logo?: string } = {},
): string {
	const base = siteUrl();
	const logoUrl = cids.logo
		? `cid:${cids.logo}`
		: `${base}/email/him-logo.png`;
	const host = base.replace(/^https?:\/\//, "");
	const legal = (label: string, path: string) =>
		`<a href="${base}${path}" style="color:${BRAND.ink};text-decoration:none;">${label}</a>`;
	const legalLinks = [
		legal("Terms", "/terms-of-sale"),
		legal("Privacy", "/privacy-policy"),
		legal("Grievance Officer", "/legals"),
	].join(`<span style="color:${BRAND.muted};">&nbsp;&middot;&nbsp;</span>`);
	const businessLine = formatBusinessFooterLine(getBusinessProfile());

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(signupOtpSubject())}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Jost:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${BRAND.bg};font-family:${SANS};">
  <tr><td align="center" style="padding:40px 32px 0;">
    <a href="${base}"><img src="${esc(logoUrl)}" width="90" alt="him" style="display:block;border:0;"></a>
  </td></tr>
  <tr><td align="center" style="padding:36px 32px 0;">
    <div style="font-size:12px;letter-spacing:3px;color:${BRAND.muted};text-transform:uppercase;">Verify your email</div>
    <h1 style="margin:16px 0 0;font-family:${SERIF};font-weight:500;font-size:42px;line-height:46px;color:${BRAND.ink};">Your verification code</h1>
    <p style="margin:18px 0 0;font-size:16px;line-height:24px;color:${BRAND.ink};">Enter this code on the signup form to create your HIM account.</p>
    <div style="margin-top:28px;font-family:${SERIF};font-size:40px;letter-spacing:10px;color:${BRAND.ink};">${esc(code)}</div>
    <p style="margin:18px 0 0;font-size:14px;line-height:22px;color:${BRAND.muted};">This code expires in 10 minutes.</p>
  </td></tr>
  <tr><td style="padding:36px 36px 40px;">
    <div style="border-top:1px solid ${BRAND.line};height:1px;line-height:1px;font-size:0;">&nbsp;</div>
    <div style="margin-top:22px;font-family:${SERIF};font-size:26px;color:${BRAND.ink};text-align:center;">It’s just him.</div>
    <div style="margin-top:8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.muted};text-align:center;">Team HIM</div>
    <div style="margin-top:26px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;line-height:16px;">${legalLinks}</div>
    <div style="margin-top:14px;text-align:center;font-size:10px;line-height:16px;color:${BRAND.muted};">HIM will not ask for this code on WhatsApp or SMS. Enter it only on ${esc(host)}.</div>
    <div style="margin-top:12px;text-align:center;font-size:10px;line-height:16px;color:${BRAND.muted};">${esc(businessLine)}</div>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
