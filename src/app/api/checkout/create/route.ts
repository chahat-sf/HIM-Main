import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
	CheckoutError,
	createCheckoutOrder,
	createGuestCheckoutOrder,
	type GuestAddressInput,
	type GuestCartLineInput,
	type GuestContactInput,
} from "@/lib/checkout";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	FIELD_LIMITS,
	isEmail,
	MAX_MERGE_JSON_BYTES,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

type CreateBody = {
	addressId?: number;
	guest?: boolean;
	contact?: Partial<GuestContactInput>;
	address?: Partial<GuestAddressInput>;
	items?: GuestCartLineInput[];
};

function parseGuestContact(
	raw: Partial<GuestContactInput> | undefined,
): GuestContactInput | null {
	if (!raw) return null;
	const fullName = String(raw.fullName ?? "").trim().slice(0, FIELD_LIMITS.fullName);
	const email = String(raw.email ?? "").trim().slice(0, FIELD_LIMITS.email);
	const phone = String(raw.phone ?? "").trim().slice(0, FIELD_LIMITS.phone);
	if (!fullName || !email || !phone || !isEmail(email)) return null;
	return { fullName, email, phone };
}

function parseGuestAddress(
	raw: Partial<GuestAddressInput> | undefined,
): GuestAddressInput | null {
	if (!raw) return null;
	const line1 = String(raw.line1 ?? "").trim().slice(0, FIELD_LIMITS.addressLine);
	const line2Raw = String(raw.line2 ?? "").trim().slice(0, FIELD_LIMITS.addressLine);
	const city = String(raw.city ?? "").trim().slice(0, FIELD_LIMITS.city);
	const state = String(raw.state ?? "").trim().slice(0, FIELD_LIMITS.state);
	const postalCode = String(raw.postalCode ?? "")
		.trim()
		.slice(0, FIELD_LIMITS.postalCode);
	const country =
		String(raw.country ?? "India").trim().slice(0, FIELD_LIMITS.country) ||
		"India";
	if (!line1 || !city || !state || !postalCode) return null;
	return {
		line1,
		line2: line2Raw || null,
		city,
		state,
		postalCode,
		country,
	};
}

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		const ip = clientIp(request);

		const parsed = await parseJsonBody<CreateBody>(
			request,
			MAX_MERGE_JSON_BYTES,
		);
		if (!parsed.ok) return parsed.response;
		const body = parsed.data;

		const isGuest = Boolean(body.guest) || !user;

		if (isGuest) {
			if (
				!rateLimit(`checkout:create:${ip}`, { limit: 20, windowMs: 60_000 })
			) {
				return tooManyRequests();
			}

			const contact = parseGuestContact(body.contact);
			const address = parseGuestAddress(body.address);
			if (!contact) {
				return NextResponse.json(
					{ error: "Name, email, and phone are required." },
					{ status: 400 },
				);
			}
			if (!address) {
				return NextResponse.json(
					{ error: "A complete shipping address is required." },
					{ status: 400 },
				);
			}
			if (!Array.isArray(body.items) || body.items.length === 0) {
				return NextResponse.json(
					{ error: "Your cart is empty." },
					{ status: 400 },
				);
			}

			const result = await createGuestCheckoutOrder({
				contact,
				address,
				items: body.items,
			});
			return NextResponse.json(result);
		}

		if (
			!rateLimit(`checkout:create:${ip}`, { limit: 20, windowMs: 60_000 }) ||
			!rateLimit(`checkout:create:user:${user!.id}`, {
				limit: 10,
				windowMs: 60_000,
			})
		) {
			return tooManyRequests();
		}

		const addressId = Number(body.addressId);
		if (!Number.isFinite(addressId) || addressId <= 0) {
			return NextResponse.json(
				{ error: "A shipping address is required." },
				{ status: 400 },
			);
		}

		const result = await createCheckoutOrder(user!, addressId);
		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof CheckoutError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("checkout create error", error);
		if (error instanceof Error) {
			if (
				error.message === "Razorpay is not configured" ||
				error.message === "Razorpay authentication failed"
			) {
				return NextResponse.json(
					{
						error:
							"Payment provider rejected the API keys. Check RAZORPAY credentials in .env.",
					},
					{ status: 502 },
				);
			}
		}
		return NextResponse.json(
			{ error: "Unable to start checkout." },
			{ status: 500 },
		);
	}
}
