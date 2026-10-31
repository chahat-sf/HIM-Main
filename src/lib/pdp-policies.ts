export const PDP_SUPPORT_EMAIL = "support@thehim.in";
export const PDP_SUPPORT_PHONE_DISPLAY = "+91 99111 67778";
export const PDP_SUPPORT_PHONE_TEL = "+919911167778";
export const PDP_SUPPORT_HOURS = "Mon–Sat, 11am – 7pm IST";
export const PDP_SUPPORT_WHATSAPP_URL = `https://wa.me/${PDP_SUPPORT_PHONE_TEL.replace("+", "")}`;

export type PdpPolicySection = {
	id: "shipping" | "cancellation" | "returns" | "support";
	label: string;
	paragraphs: string[];
};

export const PDP_POLICY_SECTIONS: PdpPolicySection[] = [
	{
		id: "shipping",
		label: "Shipping & Delivery",
		paragraphs: [
			"Complimentary shipping on all prepaid orders within India.",
			"Orders typically arrive in 5–7 business days. Timelines are estimates and may vary by location or courier delays.",
		],
	},
	{
		id: "cancellation",
		label: "Order Cancellation",
		paragraphs: [
			"You can cancel your order anytime before it is dispatched. Reach us by email, phone, or WhatsApp with your order number.",
			"Once an order has been dispatched, it can no longer be cancelled. You may still request a return after delivery under our returns policy.",
		],
	},
	{
		id: "returns",
		label: "Returns & Refunds",
		paragraphs: [
			"Returns and exchanges are accepted within 14 days of delivery for unused, unworn pieces returned with original tags and packaging.",
			"Once we receive and inspect the return, refunds are issued to the original payment method within 5–7 business days.",
			"For made-to-measure adjustments arranged after your order, our team will guide you on the right next step.",
		],
	},
	{
		id: "support",
		label: "Customer Support",
		paragraphs: [
			"Questions about fit, delivery, or your order? Our team is here Mon–Sat, 11am – 7pm IST.",
		],
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
