import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAddress, getAccountPayload } from "@/lib/account";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { FIELD_LIMITS, parseJsonBody, tooManyRequests } from "@/lib/validation";

type AddressBody = {
	label?: string;
	line1?: string;
	line2?: string | null;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
	isDefault?: boolean;
};

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (
			!rateLimit(`addresses:${ip}`, { limit: 30, windowMs: 60_000 }) ||
			!rateLimit(`addresses:user:${user.id}`, { limit: 30, windowMs: 60_000 })
		) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<AddressBody>(request);
		if (!parsed.ok) return parsed.response;
		const body = parsed.data;

		const line1 = body.line1?.trim() ?? "";
		const city = body.city?.trim() ?? "";
		const state = body.state?.trim() ?? "";
		const postalCode = body.postalCode?.trim() ?? "";

		if (!line1 || !city || !state || !postalCode) {
			return NextResponse.json(
				{ error: "Please fill in address, city, state, and postal code." },
				{ status: 400 },
			);
		}
		if (
			line1.length > FIELD_LIMITS.addressLine ||
			(body.line2 != null &&
				String(body.line2).trim().length > FIELD_LIMITS.addressLine) ||
			city.length > FIELD_LIMITS.city ||
			state.length > FIELD_LIMITS.state ||
			postalCode.length > FIELD_LIMITS.postalCode ||
			(body.country != null &&
				body.country.trim().length > FIELD_LIMITS.country) ||
			(body.label != null &&
				body.label.trim().length > FIELD_LIMITS.addressLabel)
		) {
			return NextResponse.json(
				{ error: "Address fields are too long." },
				{ status: 400 },
			);
		}

		const addressId = await createAddress(user.id, {
			label: body.label,
			line1,
			line2: body.line2,
			city,
			state,
			postalCode,
			country: body.country,
			isDefault: Boolean(body.isDefault),
		});

		const payload = await getAccountPayload(user);
		return NextResponse.json({ ...payload, createdAddressId: addressId });
	} catch (error) {
		console.error("addresses POST error", error);
		return NextResponse.json(
			{ error: "Unable to save address." },
			{ status: 500 },
		);
	}
}
