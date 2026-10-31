import nodemailer, { type Transporter } from "nodemailer";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import {
	orderConfirmationSubject,
	renderOrderConfirmationEmail,
	type OrderEmailData,
} from "@/lib/email/order-confirmation";

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

/** Load order + line items (with catalog images) for the email. */
async function loadOrderEmailData(
	orderId: number,
): Promise<(OrderEmailData & { to: string }) | null> {
	const db = getDb();
	const [orders] = await db.query<RowDataPacket[]>(
		`SELECT o.order_number, o.currency, o.subtotal_cents, o.tax_cents,
            o.total_cents, o.placed_at, u.email
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

	return {
		to: String(order.email),
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
			image: String(row.image_url ?? ""),
		})),
	};
}

/** Send the order confirmation. Never throws: email must not break checkout. */
export async function sendOrderConfirmationEmail(
	orderId: number,
): Promise<void> {
	try {
		const mailer = getTransporter();
		if (!mailer) {
			console.warn("order email skipped: SMTP_* env vars not configured");
			return;
		}
		const data = await loadOrderEmailData(orderId);
		if (!data) return;
		await mailer.sendMail({
			from: process.env.EMAIL_FROM || process.env.SMTP_USER,
			to: data.to,
			subject: orderConfirmationSubject(data),
			html: renderOrderConfirmationEmail(data),
		});
	} catch (error) {
		console.error("order confirmation email failed", error);
	}
}
