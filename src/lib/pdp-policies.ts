export const PDP_SUPPORT_EMAIL = "support@thehim.in";
export const PDP_SUPPORT_PHONE_DISPLAY = "+91 99111 67778";
export const PDP_SUPPORT_PHONE_TEL = "+919911167778";
/** Exact customer-care hours from Grievance Redressal & Contact Details. */
export const PDP_SUPPORT_HOURS = "Monday to Saturday, 10:00 to 18:00 IST";
export const PDP_SUPPORT_WHATSAPP_URL = `https://wa.me/${PDP_SUPPORT_PHONE_TEL.replace("+", "")}`;

export type PdpPolicySection = {
	id: "shipping" | "cancellation" | "returns" | "support";
	label: string;
	paragraphs: string[];
	/** Full policy page for complete detail. */
	policyHref?: string;
	policyLinkLabel?: string;
};

export const PDP_POLICY_SECTIONS: PdpPolicySection[] = [
	{
		id: "shipping",
		label: "Shipping & Delivery",
		policyHref: "/shipping-policy",
		policyLinkLabel: "Shipping Policy",
		paragraphs: [
			"Shipping is free on all orders, within India and internationally. International orders may still attract customs duties and import taxes in the destination country.",
			"Made-to-order production takes 10–15 business days (India and international). Transit after dispatch is 4–7 business days within India and 7–14 business days internationally. Timelines are estimates from order confirmation and exclude Sundays and public holidays. You will receive tracking details by email or SMS once your order ships.",
			"Every order is shipped fully insured in tamper-evident HIM World packaging. High-value deliveries require OTP verification at the door. Please inspect the outer packaging before accepting. If it appears tampered or damaged, refuse delivery or note it on the courier’s record, and email support@thehim.in within 24 hours with photos.",
		],
	},
	{
		id: "cancellation",
		label: "Order Cancellation",
		policyHref: "/returns-refund-policy",
		policyLinkLabel: "Returns & Refund Policy",
		paragraphs: [
			"Orders can be cancelled within 24 hours of purchase, before production begins, for a full refund. After production starts, orders cannot be cancelled.",
		],
	},
	{
		id: "returns",
		label: "Returns & Refunds",
		policyHref: "/returns-refund-policy",
		policyLinkLabel: "Returns & Refund Policy",
		paragraphs: [
			"Every HIM World piece is made to order. Made-to-order, customised, bespoke or monogrammed garments, and pieces made to your measurements, cannot be returned or exchanged except when damaged, defective or incorrect on arrival.",
			"Where an item is eligible, you may request a return or exchange within 7 days of delivery. Requests after this window cannot be accepted.",
			"To pass our quality check (QC), items must be unworn, unwashed, unaltered and free of perfume, makeup, stains or odour; with all original tags, labels and security tags intact; and in the original HIM World packaging (box, dust bag, tissue) with the authenticity card and invoice. Items that fail QC will be shipped back to you at your cost, and no refund will be issued. HIM World’s QC decision is final.",
			"Change-of-mind returns (where eligible) are refunded as HIM World store credit only. Store credit is non-transferable, cannot be exchanged for cash, and expires 12 months from issue. Refunds to the original payment source are issued only for orders cancelled by us, items damaged or defective on arrival, or wrong items sent by us. Approved refunds and credits are processed within 5–7 business days after passing QC. Banks may take an additional 5–10 business days to reflect the amount.",
		],
	},
	{
		id: "support",
		label: "Customer Support",
		policyHref: "/grievance-contact",
		policyLinkLabel: "Grievance Redressal & Contact",
		paragraphs: [`Customer care: ${PDP_SUPPORT_EMAIL} (${PDP_SUPPORT_HOURS}).`],
	},
];

export const PDP_SUPPORT_LINKS = [
	{
		label: "Email",
		value: PDP_SUPPORT_EMAIL,
		href: `mailto:${PDP_SUPPORT_EMAIL}`,
	},
	{
		label: "Phone",
		value: PDP_SUPPORT_PHONE_DISPLAY,
		href: `tel:${PDP_SUPPORT_PHONE_TEL}`,
	},
	{
		label: "WhatsApp",
		value: PDP_SUPPORT_PHONE_DISPLAY,
		href: PDP_SUPPORT_WHATSAPP_URL,
	},
] as const;
