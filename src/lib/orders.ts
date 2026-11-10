import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import type { AddressSnapshot } from "@/lib/checkout";

export type OrderConfirmationItem = {
	name: string;
	slug: string;
	color: string;
	size: string;
	qty: number;
	unitPriceCents: number;
	image: string;
};

export type OrderConfirmation = {
	orderId: number;
	orderNumber: string;
	status: string;
	paymentStatus: string;
	currency: string;
	subtotalCents: number;
	taxCents: number;
	totalCents: number;
	placedAt: string | null;
	paymentId: string | null;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	address: AddressSnapshot | null;
	items: OrderConfirmationItem[];
};

function parseAddressSnapshot(raw: unknown): AddressSnapshot | null {
	try {
		const addr =
			typeof raw === "string" ? (JSON.parse(raw) as AddressSnapshot) : raw;
		if (!addr || typeof addr !== "object") return null;
		const a = addr as AddressSnapshot;
		if (!a.line1 || !a.city) return null;
		return {
			id: Number(a.id) || 0,
			label: String(a.label || ""),
			line1: String(a.line1 || ""),
			line2: a.line2 ? String(a.line2) : null,
			city: String(a.city || ""),
			state: String(a.state || ""),
			postalCode: String(a.postalCode || ""),
			country: String(a.country || ""),
			fullName: String(a.fullName || ""),
			email: a.email ? String(a.email) : undefined,
			phone: a.phone ? String(a.phone) : undefined,
		};
	} catch {
		return null;
	}
}

/**
 * Load an order the signed-in user owns (paid or failed/cancelled after create).
 * Used by success, failed, and invoice surfaces.
 */
export async function getOrderConfirmation(
	userId: number,
	orderNumber: string,
): Promise<OrderConfirmation | null> {
	const trimmed = orderNumber.trim();
	if (!trimmed) return null;

	const db = getDb();
	const [orders] = await db.query<RowDataPacket[]>(
		`SELECT o.id, o.order_number, o.status, o.payment_status, o.currency,
            o.subtotal_cents, o.tax_cents, o.total_cents, o.placed_at,
            o.address_snapshot, o.razorpay_payment_id,
            u.email, u.full_name, u.phone
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.user_id = :userId AND o.order_number = :orderNumber
     LIMIT 1`,
		{ userId, orderNumber: trimmed },
	);

	const order = orders?.[0];
	if (!order) return null;

	const orderId = Number(order.id);
	const [items] = await db.query<RowDataPacket[]>(
		`SELECT i.product_name, i.product_slug, i.color, i.size, i.quantity,
            i.unit_price_cents, p.image_url
     FROM order_items i
     LEFT JOIN products p ON (
       (i.product_id IS NOT NULL AND p.id = i.product_id)
       OR (i.product_id IS NULL AND p.slug = i.product_slug)
     )
     WHERE i.order_id = :orderId
     ORDER BY i.id`,
		{ orderId },
	);

	const address = parseAddressSnapshot(order.address_snapshot);

	return {
		orderId,
		orderNumber: String(order.order_number),
		status: String(order.status || ""),
		paymentStatus: String(order.payment_status || ""),
		currency: String(order.currency || "INR"),
		subtotalCents: Number(order.subtotal_cents) || 0,
		taxCents: Number(order.tax_cents) || 0,
		totalCents: Number(order.total_cents) || 0,
		placedAt: order.placed_at ? new Date(order.placed_at).toISOString() : null,
		paymentId: order.razorpay_payment_id
			? String(order.razorpay_payment_id)
			: null,
		customerName: String(address?.fullName || order.full_name || ""),
		customerEmail: String(address?.email || order.email || ""),
		customerPhone: String(address?.phone || order.phone || ""),
		address,
		items: (items ?? []).map((row) => ({
			name: String(row.product_name),
			slug: String(row.product_slug || ""),
			color: String(row.color ?? ""),
			size: String(row.size ?? ""),
			qty: Number(row.quantity) || 1,
			unitPriceCents: Number(row.unit_price_cents) || 0,
			image: String(row.image_url ?? ""),
		})),
	};
}

/**
 * Load an order by number without a session (guest success/failed pages).
 * Order numbers are unguessable enough for v1; only returns known statuses.
 */
export async function getOrderConfirmationByNumber(
	orderNumber: string,
): Promise<OrderConfirmation | null> {
	const trimmed = orderNumber.trim();
	if (!trimmed) return null;

	const db = getDb();
	const [orders] = await db.query<RowDataPacket[]>(
		`SELECT o.user_id
     FROM orders o
     WHERE o.order_number = :orderNumber
     LIMIT 1`,
		{ orderNumber: trimmed },
	);
	const order = orders?.[0];
	if (!order) return null;
	return getOrderConfirmation(Number(order.user_id), trimmed);
}
