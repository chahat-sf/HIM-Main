import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import type { PublicUser } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email/send";
import { splitInclusiveGst } from "@/lib/gst";
import {
	assertRazorpayConfigured,
	createRazorpayOrder,
	getRazorpayKeyId,
	verifyPaymentSignature,
} from "@/lib/razorpay";
import type { OrderConfirmation } from "@/lib/orders";
import { getOrderConfirmation } from "@/lib/orders";

export { TAX_RATE, splitInclusiveGst } from "@/lib/gst";

export type CheckoutLine = {
	productId: number | null;
	slug: string;
	name: string;
	size: string;
	color: string;
	qty: number;
	unitPriceCents: number;
	image: string;
};

export type AddressSnapshot = {
	id: number;
	label: string;
	line1: string;
	line2: string | null;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	fullName: string;
	email?: string;
	phone?: string;
};

/** Client-trusted identity fields only — prices are always resolved server-side. */
export type GuestCartLineInput = {
	productId?: number | null;
	slug: string;
	size: string;
	color: string;
	qty: number;
};

export type GuestContactInput = {
	fullName: string;
	email: string;
	phone: string;
};

export type GuestAddressInput = {
	line1: string;
	line2?: string | null;
	city: string;
	state: string;
	postalCode: string;
	country: string;
};

export type CheckoutTotals = {
	subtotalCents: number;
	taxCents: number;
	totalCents: number;
	itemCount: number;
};

export type CreateCheckoutResult = {
	orderId: number;
	orderNumber: string;
	keyId: string;
	razorpayOrderId: string;
	amount: number;
	currency: string;
	customer: {
		name: string;
		email: string;
		contact: string | null;
	};
};

export type VerifyCheckoutResult = {
	orderId: number;
	orderNumber: string;
	totalCents: number;
	currency: string;
	/** Present when confirmation summary loads after verify. */
	confirmation?: OrderConfirmation;
};

function generateOrderNumber(): string {
	const now = new Date();
	const y = now.getFullYear().toString().slice(-2);
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `HIM${y}${m}${d}${rand}`;
}

export function computeTotals(lines: CheckoutLine[]): CheckoutTotals {
	const totalCents = lines.reduce(
		(sum, line) => sum + line.unitPriceCents * line.qty,
		0,
	);
	const { taxableCents, taxCents } = splitInclusiveGst(totalCents);
	const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
	return {
		subtotalCents: taxableCents,
		taxCents,
		totalCents,
		itemCount,
	};
}

/** Load cart lines with catalog prices in paise (never trust client). */
export async function loadCheckoutLines(
	userId: number,
): Promise<CheckoutLine[]> {
	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT
       c.product_id,
       c.product_slug,
       c.product_name,
       c.size,
       c.color,
       c.qty,
       c.image_url,
       COALESCE(p.price_cents, c.price_cents) AS price_cents,
       p.image_url AS product_image_url,
       p.name AS catalog_name,
       p.slug AS catalog_slug
     FROM cart_items c
     LEFT JOIN products p ON (
       (c.product_id IS NOT NULL AND p.id = c.product_id)
       OR (c.product_id IS NULL AND p.slug = c.product_slug)
     )
     WHERE c.user_id = :userId
     ORDER BY c.updated_at DESC, c.id DESC`,
		{ userId },
	);

	return (rows ?? []).map((row) => {
		const productId = row.product_id == null ? null : Number(row.product_id);
		return {
			productId,
			slug: String(row.catalog_slug || row.product_slug),
			name: String(row.catalog_name || row.product_name),
			size: String(row.size ?? ""),
			color: String(row.color ?? ""),
			qty: Math.max(1, Number(row.qty) || 1),
			unitPriceCents: Math.max(0, Number(row.price_cents) || 0),
			image: String(row.product_image_url || row.image_url || ""),
		};
	});
}

export async function getAddressForUser(
	userId: number,
	addressId: number,
	fullName: string,
): Promise<AddressSnapshot | null> {
	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT id, label, line1, line2, city, state, postal_code, country
     FROM addresses
     WHERE id = :addressId AND user_id = :userId
     LIMIT 1`,
		{ addressId, userId },
	);
	const row = rows?.[0];
	if (!row) return null;
	return {
		id: Number(row.id),
		label: String(row.label),
		line1: String(row.line1),
		line2: row.line2 ? String(row.line2) : null,
		city: String(row.city),
		state: String(row.state),
		postalCode: String(row.postal_code),
		country: String(row.country),
		fullName,
	};
}

export async function clearCart(userId: number): Promise<void> {
	const db = getDb();
	await db.execute(`DELETE FROM cart_items WHERE user_id = :userId`, {
		userId,
	});
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function asPublicUser(row: RowDataPacket): PublicUser {
	return {
		id: Number(row.id),
		fullName: String(row.full_name || ""),
		email: String(row.email || ""),
		phone: row.phone != null ? String(row.phone) : null,
		dateOfBirth: row.date_of_birth
			? new Date(row.date_of_birth).toISOString().slice(0, 10)
			: null,
	};
}

/**
 * Find user by email or create a lightweight guest row (password_hash NULL).
 * Existing accounts are attached silently — no login required.
 */
export async function resolveCheckoutUserByEmail(
	contact: GuestContactInput,
): Promise<PublicUser> {
	const email = normalizeEmail(contact.email);
	const fullName = contact.fullName.trim().slice(0, 120);
	const phone = contact.phone.trim().slice(0, 40);
	if (!email || !fullName || !phone) {
		throw new CheckoutError("Name, email, and phone are required.", 400);
	}

	const db = getDb();
	const [existing] = await db.query<RowDataPacket[]>(
		`SELECT id, full_name, email, phone, date_of_birth
     FROM users WHERE email = :email LIMIT 1`,
		{ email },
	);
	const row = existing?.[0];
	if (row) {
		const user = asPublicUser(row);
		// Fill missing phone on silent attach so invoices/Razorpay have contact.
		if (!user.phone && phone) {
			await db.execute(
				`UPDATE users SET phone = :phone WHERE id = :id AND (phone IS NULL OR phone = '')`,
				{ phone, id: user.id },
			);
			user.phone = phone;
		}
		return user;
	}

	const [insert] = await db.execute<ResultSetHeader>(
		`INSERT INTO users (full_name, email, phone, password_hash)
     VALUES (:fullName, :email, :phone, NULL)`,
		{ fullName, email, phone },
	);
	return {
		id: Number(insert.insertId),
		fullName,
		email,
		phone,
		dateOfBirth: null,
	};
}

/** Reprice guest cart lines from catalog — never trust client prices. */
export async function resolveGuestCheckoutLines(
	inputs: GuestCartLineInput[],
): Promise<CheckoutLine[]> {
	if (!Array.isArray(inputs) || inputs.length === 0) {
		throw new CheckoutError("Your cart is empty.", 400);
	}
	if (inputs.length > 40) {
		throw new CheckoutError("Too many items in cart.", 400);
	}

	const db = getDb();
	const lines: CheckoutLine[] = [];

	for (const raw of inputs) {
		const slug = String(raw.slug ?? "").trim();
		const productIdRaw = raw.productId;
		const productId =
			productIdRaw == null || !Number.isFinite(Number(productIdRaw))
				? null
				: Number(productIdRaw);
		const qty = Math.min(99, Math.max(1, Number(raw.qty) || 1));
		const size = String(raw.size ?? "")
			.trim()
			.slice(0, 40);
		const color = String(raw.color ?? "")
			.trim()
			.slice(0, 80);

		if (!slug && (productId == null || !Number.isFinite(productId))) {
			throw new CheckoutError("Invalid cart item.", 400);
		}

		let rows: RowDataPacket[] = [];
		if (productId != null && Number.isFinite(productId) && productId > 0) {
			const [byId] = await db.query<RowDataPacket[]>(
				`SELECT id, slug, name, image_url, price_cents
         FROM products WHERE id = :id LIMIT 1`,
				{ id: productId },
			);
			rows = byId ?? [];
		}
		if (rows.length === 0 && slug) {
			const [bySlug] = await db.query<RowDataPacket[]>(
				`SELECT id, slug, name, image_url, price_cents
         FROM products WHERE slug = :slug LIMIT 1`,
				{ slug },
			);
			rows = bySlug ?? [];
		}

		const product = rows[0];
		if (!product) {
			throw new CheckoutError(
				`Product not found${slug ? `: ${slug}` : ""}.`,
				400,
			);
		}

		lines.push({
			productId: Number(product.id),
			slug: String(product.slug),
			name: String(product.name),
			size,
			color,
			qty,
			unitPriceCents: Math.max(0, Number(product.price_cents) || 0),
			image: String(product.image_url || ""),
		});
	}

	return lines;
}

function snapshotFromGuestAddress(
	contact: GuestContactInput,
	address: GuestAddressInput,
): AddressSnapshot {
	const line1 = address.line1.trim();
	const city = address.city.trim();
	const state = address.state.trim();
	const postalCode = address.postalCode.trim();
	const country = (address.country || "India").trim() || "India";
	if (!line1 || !city || !state || !postalCode) {
		throw new CheckoutError("A complete shipping address is required.", 400);
	}
	return {
		id: 0,
		label: "SHIPPING ADDRESS",
		line1,
		line2: address.line2?.trim() ? address.line2.trim() : null,
		city,
		state,
		postalCode,
		country,
		fullName: contact.fullName.trim(),
		email: normalizeEmail(contact.email),
		phone: contact.phone.trim(),
	};
}

async function persistCheckoutOrder(params: {
	user: PublicUser;
	address: AddressSnapshot;
	lines: CheckoutLine[];
	customer: { name: string; email: string; contact: string | null };
}): Promise<CreateCheckoutResult> {
	const { user, address, lines, customer } = params;
	assertRazorpayConfigured();

	if (lines.length === 0) {
		throw new CheckoutError("Your cart is empty.", 400);
	}

	const totals = computeTotals(lines);
	if (totals.totalCents < 100) {
		throw new CheckoutError("Order total is too low.", 400);
	}

	const orderNumber = generateOrderNumber();
	const db = getDb();
	const conn = await db.getConnection();

	let localOrderId: number;
	try {
		await conn.beginTransaction();

		const [orderResult] = await conn.execute<ResultSetHeader>(
			`INSERT INTO orders
        (user_id, order_number, status, item_count, total_cents, currency,
         payment_status, address_snapshot, subtotal_cents, tax_cents)
       VALUES
        (:userId, :orderNumber, 'pending', :itemCount, :totalCents, 'INR',
         'created', CAST(:addressSnapshot AS JSON), :subtotalCents, :taxCents)`,
			{
				userId: user.id,
				orderNumber,
				itemCount: totals.itemCount,
				totalCents: totals.totalCents,
				addressSnapshot: JSON.stringify(address),
				subtotalCents: totals.subtotalCents,
				taxCents: totals.taxCents,
			},
		);

		localOrderId = Number(orderResult.insertId);

		for (const line of lines) {
			await conn.execute(
				`INSERT INTO order_items
          (order_id, product_id, product_slug, product_name, size, color, quantity, unit_price_cents)
         VALUES
          (:orderId, :productId, :slug, :name, :size, :color, :qty, :unitPriceCents)`,
				{
					orderId: localOrderId,
					productId: line.productId,
					slug: line.slug,
					name: line.name,
					size: line.size.slice(0, 40),
					color: line.color.slice(0, 80),
					qty: line.qty,
					unitPriceCents: line.unitPriceCents,
				},
			);
		}

		await conn.commit();
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}

	let razorpayOrder: { id: string; amount: number; currency: string };
	try {
		razorpayOrder = await createRazorpayOrder({
			amountPaise: totals.totalCents,
			receipt: orderNumber,
			notes: {
				order_number: orderNumber,
				user_id: String(user.id),
			},
		});
	} catch (err) {
		await db.execute(
			`UPDATE orders
       SET status = 'cancelled', payment_status = 'failed'
       WHERE id = :id AND user_id = :userId`,
			{ id: localOrderId, userId: user.id },
		);
		throw err;
	}

	await db.execute(
		`UPDATE orders
     SET razorpay_order_id = :razorpayOrderId
     WHERE id = :id AND user_id = :userId`,
		{
			id: localOrderId,
			userId: user.id,
			razorpayOrderId: razorpayOrder.id,
		},
	);

	return {
		orderId: localOrderId,
		orderNumber,
		keyId: getRazorpayKeyId(),
		razorpayOrderId: razorpayOrder.id,
		amount: razorpayOrder.amount,
		currency: razorpayOrder.currency,
		customer,
	};
}

export async function createGuestCheckoutOrder(input: {
	contact: GuestContactInput;
	address: GuestAddressInput;
	items: GuestCartLineInput[];
}): Promise<CreateCheckoutResult> {
	const user = await resolveCheckoutUserByEmail(input.contact);
	const address = snapshotFromGuestAddress(input.contact, input.address);
	const lines = await resolveGuestCheckoutLines(input.items);
	return persistCheckoutOrder({
		user,
		address,
		lines,
		customer: {
			name: input.contact.fullName.trim(),
			email: normalizeEmail(input.contact.email),
			contact: input.contact.phone.trim(),
		},
	});
}

export async function createCheckoutOrder(
	user: PublicUser,
	addressId: number,
): Promise<CreateCheckoutResult> {
	const address = await getAddressForUser(user.id, addressId, user.fullName);
	if (!address) {
		throw new CheckoutError("Address not found.", 400);
	}

	const lines = await loadCheckoutLines(user.id);
	return persistCheckoutOrder({
		user,
		address: {
			...address,
			email: user.email,
			phone: user.phone ?? undefined,
		},
		lines,
		customer: {
			name: user.fullName,
			email: user.email,
			contact: user.phone,
		},
	});
}

export async function verifyCheckoutPayment(
	input: {
		razorpayOrderId: string;
		razorpayPaymentId: string;
		razorpaySignature: string;
	},
	/** When set, order must belong to this user. Guests omit it. */
	user?: PublicUser | null,
): Promise<VerifyCheckoutResult> {
	const ok = verifyPaymentSignature({
		razorpayOrderId: input.razorpayOrderId,
		razorpayPaymentId: input.razorpayPaymentId,
		razorpaySignature: input.razorpaySignature,
	});
	if (!ok) {
		throw new CheckoutError("Payment verification failed.", 400);
	}

	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		user
			? `SELECT id, user_id, order_number, total_cents, currency, payment_status, status
         FROM orders
         WHERE user_id = :userId AND razorpay_order_id = :razorpayOrderId
         LIMIT 1`
			: `SELECT id, user_id, order_number, total_cents, currency, payment_status, status
         FROM orders
         WHERE razorpay_order_id = :razorpayOrderId
         LIMIT 1`,
		user
			? { userId: user.id, razorpayOrderId: input.razorpayOrderId }
			: { razorpayOrderId: input.razorpayOrderId },
	);

	const row = rows?.[0];
	if (!row) {
		throw new CheckoutError("Order not found.", 404);
	}

	const orderId = Number(row.id);
	const ownerUserId = Number(row.user_id);
	const orderNumber = String(row.order_number);
	const totalCents = Number(row.total_cents);
	const currency = String(row.currency || "INR");

	if (String(row.payment_status) !== "paid") {
		const [updateResult] = await db.execute<ResultSetHeader>(
			`UPDATE orders
       SET status = 'processing',
           payment_status = 'paid',
           razorpay_payment_id = :paymentId,
           placed_at = CURRENT_TIMESTAMP
       WHERE id = :id AND payment_status <> 'paid'`,
			{
				id: orderId,
				paymentId: input.razorpayPaymentId,
			},
		);

		await clearCart(ownerUserId);

		// Only the request that flipped the order to paid sends the email.
		if (updateResult.affectedRows > 0) {
			await sendOrderConfirmationEmail(orderId);
		}
	}

	const confirmation = await getOrderConfirmation(ownerUserId, orderNumber);

	return {
		orderId,
		orderNumber,
		totalCents,
		currency,
		confirmation: confirmation ?? undefined,
	};
}

export class CheckoutError extends Error {
	status: number;

	constructor(message: string, status = 400) {
		super(message);
		this.name = "CheckoutError";
		this.status = status;
	}
}
