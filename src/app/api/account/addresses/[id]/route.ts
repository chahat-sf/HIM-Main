import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
	deleteAddress,
	getAccountPayload,
	setDefaultAddress,
} from "@/lib/account";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseJsonBody, tooManyRequests } from "@/lib/validation";

type PatchBody = {
	isDefault?: boolean;
};

type RouteContext = {
	params: Promise<{ id: string }> | { id: string };
};

async function resolveId(context: RouteContext): Promise<number | null> {
	const resolved = await Promise.resolve(context.params);
	const raw = typeof resolved?.id === "string" ? resolved.id : "";
	const id = Number(raw);
	return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
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

		const addressId = await resolveId(context);
		if (!addressId) {
			return NextResponse.json({ error: "Invalid address." }, { status: 400 });
		}

		const parsed = await parseJsonBody<PatchBody>(request);
		if (!parsed.ok) return parsed.response;

		if (parsed.data.isDefault) {
			const ok = await setDefaultAddress(user.id, addressId);
			if (!ok) {
				return NextResponse.json(
					{ error: "Address not found." },
					{ status: 404 },
				);
			}
		}

		return NextResponse.json(await getAccountPayload(user));
	} catch (error) {
		console.error("addresses PATCH error", error);
		return NextResponse.json(
			{ error: "Unable to update address." },
			{ status: 500 },
		);
	}
}

export async function DELETE(_request: Request, context: RouteContext) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(_request);
		if (
			!rateLimit(`addresses:${ip}`, { limit: 30, windowMs: 60_000 }) ||
			!rateLimit(`addresses:user:${user.id}`, { limit: 30, windowMs: 60_000 })
		) {
			return tooManyRequests();
		}

		const addressId = await resolveId(context);
		if (!addressId) {
			return NextResponse.json({ error: "Invalid address." }, { status: 400 });
		}

		const ok = await deleteAddress(user.id, addressId);
		if (!ok) {
			return NextResponse.json(
				{ error: "Address not found." },
				{ status: 404 },
			);
		}

		return NextResponse.json(await getAccountPayload(user));
	} catch (error) {
		console.error("addresses DELETE error", error);
		return NextResponse.json(
			{ error: "Unable to delete address." },
			{ status: 500 },
		);
	}
}
