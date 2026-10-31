import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getDb } from "@/lib/db";
import type { PublicUser } from "@/lib/auth";

export type Address = {
	id: number;
	label: string;
	line1: string;
	line2: string | null;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	isDefault: boolean;
	lines: string[];
};

export type OrderRow = {
	id: number;
	orderNumber: string;
	date: string;
	items: number;
	status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
	statusLabel: string;
	statusColor: string;
	total: string;
};

export type SavedItem = {
	id: number;
	productId: number | null;
	slug: string;
	name: string;
	price: string;
	image: string;
	swatches: string[];
};

export type AccountPayload = {
	user: PublicUser;
	addresses: Address[];
	orders: OrderRow[];
	savedItems: SavedItem[];
};

const STATUS_META: Record<
	OrderRow["status"],
	{ label: string; color: string }
> = {
	pending: { label: "Pending", color: "#9a9a9a" },
	processing: { label: "Processing", color: "#d4a017" },
	shipped: { label: "Shipped", color: "#6ba3e8" },
	delivered: { label: "Delivered", color: "#5aad6e" },
	cancelled: { label: "Cancelled", color: "#c45c5c" },
};

export function formatInr(cents: number): string {
	const rupees = Math.round(cents / 100);
	return `₹ ${rupees.toLocaleString("en-IN")}`;
}

function formatOrderDate(value: Date | string): string {
	const d = typeof value === "string" ? new Date(value) : value;
	return d.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function addressLines(row: {
	full_name?: string;
	line1: string;
	line2: string | null;
	city: string;
	state: string;
	postal_code: string;
	country: string;
}): string[] {
	const lines = [row.line1];
	if (row.line2) lines.push(row.line2);
	lines.push(`${row.city}, ${row.state} ${row.postal_code}`);
	lines.push(row.country);
	return lines;
}

export async function getAccountPayload(
	user: PublicUser,
): Promise<AccountPayload> {
	const db = getDb();

	const [addressRows] = await db.query<RowDataPacket[]>(
		`SELECT id, label, line1, line2, city, state, postal_code, country, is_default
     FROM addresses WHERE user_id = :userId
     ORDER BY is_default DESC, id ASC`,
		{ userId: user.id },
	);

	const [orderRows] = await db.query<RowDataPacket[]>(
		`SELECT id, order_number, status, item_count, total_cents, placed_at
     FROM orders
     WHERE user_id = :userId AND payment_status = 'paid'
     ORDER BY placed_at DESC, id DESC`,
		{ userId: user.id },
	);

	const [savedRows] = await db.query<RowDataPacket[]>(
		`SELECT id, product_id, product_slug, product_name, price_cents, image_url, swatches_json
     FROM saved_items WHERE user_id = :userId
     ORDER BY created_at DESC, id DESC`,
		{ userId: user.id },
	);

	const addresses: Address[] = (addressRows ?? []).map((row) => ({
		id: Number(row.id),
		label: String(row.label),
		line1: String(row.line1),
		line2: row.line2 ? String(row.line2) : null,
		city: String(row.city),
		state: String(row.state),
		postalCode: String(row.postal_code),
		country: String(row.country),
		isDefault: Boolean(row.is_default),
		lines: [user.fullName, ...addressLines(row as never)],
	}));

	const orders: OrderRow[] = (orderRows ?? []).map((row) => {
		const status = String(row.status) as OrderRow["status"];
		const meta = STATUS_META[status] ?? STATUS_META.processing;
		return {
			id: Number(row.id),
			orderNumber: `#${row.order_number}`,
			date: formatOrderDate(row.placed_at as Date | string),
			items: Number(row.item_count),
			status,
			statusLabel: meta.label,
			statusColor: meta.color,
			total: formatInr(Number(row.total_cents)),
		};
	});

	const savedItems: SavedItem[] = (savedRows ?? []).map((row) => {
		let swatches: string[] = [];
		const raw = row.swatches_json;
		if (Array.isArray(raw)) {
			swatches = raw.map(String);
		} else if (typeof raw === "string") {
			try {
				const parsed = JSON.parse(raw) as unknown;
				if (Array.isArray(parsed)) swatches = parsed.map(String);
			} catch {
				swatches = [];
			}
		}

		return {
			id: Number(row.id),
			productId: row.product_id == null ? null : Number(row.product_id),
			slug: String(row.product_slug),
			name: String(row.product_name),
			price: formatInr(Number(row.price_cents)),
			image: String(row.image_url),
			swatches,
		};
	});

	return {
		user,
		addresses,
		orders,
		savedItems,
	};
}

export async function updateProfile(
	userId: number,
	input: {
		fullName?: string;
		phone?: string | null;
		dateOfBirth?: string | null;
	},
): Promise<void> {
	const db = getDb();
	const sets: string[] = [];
	const params: {
		userId: number;
		fullName?: string;
		phone?: string | null;
		dateOfBirth?: string | null;
	} = { userId };

	if (input.fullName !== undefined) {
		sets.push("full_name = :fullName");
		params.fullName = input.fullName.trim();
	}
	if (input.phone !== undefined) {
		sets.push("phone = :phone");
		params.phone = input.phone?.trim() || null;
	}
	if (input.dateOfBirth !== undefined) {
		sets.push("date_of_birth = :dateOfBirth");
		params.dateOfBirth = input.dateOfBirth || null;
	}

	if (sets.length === 0) return;

	await db.execute(
		`UPDATE users SET ${sets.join(", ")} WHERE id = :userId`,
		params,
	);
}

type AddressInput = {
	label?: string;
	line1: string;
	line2?: string | null;
	city: string;
	state: string;
	postalCode: string;
	country?: string;
	isDefault?: boolean;
};

async function clearDefaultFlags(userId: number): Promise<void> {
	const db = getDb();
	await db.execute(
		`UPDATE addresses SET is_default = 0 WHERE user_id = :userId AND is_default = 1`,
		{ userId },
	);
}

async function countAddresses(userId: number): Promise<number> {
	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT COUNT(*) AS n FROM addresses WHERE user_id = :userId`,
		{ userId },
	);
	return Number(rows?.[0]?.n ?? 0);
}

/** Create a new address. First address (or isDefault) becomes the default. */
export async function createAddress(
	userId: number,
	input: AddressInput,
): Promise<number> {
	const db = getDb();
	const existingCount = await countAddresses(userId);
	const makeDefault = existingCount === 0 || Boolean(input.isDefault);
	const label = (
		input.label?.trim() ||
		(makeDefault ? "DEFAULT SHIPPING ADDRESS" : "SHIPPING ADDRESS")
	).toUpperCase();
	const line2 = input.line2?.trim() || null;
	const country = input.country?.trim() || "India";

	if (makeDefault && existingCount > 0) {
		await clearDefaultFlags(userId);
	}

	const [result] = await db.execute<ResultSetHeader>(
		`INSERT INTO addresses
      (user_id, label, line1, line2, city, state, postal_code, country, is_default)
     VALUES
      (:userId, :label, :line1, :line2, :city, :state, :postalCode, :country, :isDefault)`,
		{
			userId,
			label,
			line1: input.line1.trim(),
			line2,
			city: input.city.trim(),
			state: input.state.trim(),
			postalCode: input.postalCode.trim(),
			country,
			isDefault: makeDefault ? 1 : 0,
		},
	);

	return Number(result.insertId);
}

export async function setDefaultAddress(
	userId: number,
	addressId: number,
): Promise<boolean> {
	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT id FROM addresses WHERE id = :addressId AND user_id = :userId LIMIT 1`,
		{ addressId, userId },
	);
	if (!rows?.[0]) return false;

	await clearDefaultFlags(userId);
	await db.execute(
		`UPDATE addresses SET is_default = 1 WHERE id = :addressId AND user_id = :userId`,
		{ addressId, userId },
	);
	return true;
}

export async function deleteAddress(
	userId: number,
	addressId: number,
): Promise<boolean> {
	const db = getDb();
	const [rows] = await db.query<RowDataPacket[]>(
		`SELECT id, is_default FROM addresses
     WHERE id = :addressId AND user_id = :userId LIMIT 1`,
		{ addressId, userId },
	);
	const current = rows?.[0];
	if (!current) return false;

	await db.execute(
		`DELETE FROM addresses WHERE id = :addressId AND user_id = :userId`,
		{ addressId, userId },
	);

	if (Boolean(current.is_default)) {
		const [next] = await db.query<RowDataPacket[]>(
			`SELECT id FROM addresses WHERE user_id = :userId ORDER BY id ASC LIMIT 1`,
			{ userId },
		);
		if (next?.[0]) {
			await db.execute(
				`UPDATE addresses SET is_default = 1 WHERE id = :id AND user_id = :userId`,
				{ id: next[0].id, userId },
			);
		}
	}

	return true;
}

/** @deprecated Prefer createAddress — kept for any leftover callers. */
export async function upsertDefaultAddress(
	userId: number,
	input: AddressInput,
): Promise<number> {
	return createAddress(userId, { ...input, isDefault: true });
}

export { addSavedItem, removeSavedItem } from "@/lib/wishlist";
