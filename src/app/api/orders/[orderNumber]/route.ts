import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
	getOrderConfirmation,
	getOrderConfirmationByNumber,
} from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { tooManyRequests } from "@/lib/validation";

type RouteContext = {
	params: Promise<{ orderNumber: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	try {
		const user = await getSessionUser();
		const ip = clientIp(_request);
		if (
			!rateLimit(`orders:get:${ip}`, { limit: 60, windowMs: 60_000 }) ||
			(user &&
				!rateLimit(`orders:get:user:${user.id}`, {
					limit: 40,
					windowMs: 60_000,
				}))
		) {
			return tooManyRequests();
		}

		const { orderNumber: raw } = await context.params;
		const orderNumber = decodeURIComponent(raw || "").trim();
		if (!orderNumber) {
			return NextResponse.json(
				{ error: "Order number required." },
				{ status: 400 },
			);
		}

		const confirmation = user
			? await getOrderConfirmation(user.id, orderNumber)
			: await getOrderConfirmationByNumber(orderNumber);

		if (!confirmation) {
			return NextResponse.json({ error: "Order not found." }, { status: 404 });
		}

		return NextResponse.json(confirmation);
	} catch (error) {
		console.error("order get error", error);
		return NextResponse.json(
			{ error: "Unable to load order." },
			{ status: 500 },
		);
	}
}
