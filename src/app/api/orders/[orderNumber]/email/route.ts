import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email/send";
import { getOrderConfirmation } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
	FIELD_LIMITS,
	isEmail,
	parseJsonBody,
	tooManyRequests,
} from "@/lib/validation";

type RouteContext = {
	params: Promise<{ orderNumber: string }>;
};

type Body = {
	email?: string;
};

/** Cooldown before allowing a resend to the registered account email. */
const REGISTERED_RESEND_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Send a copy of the order confirmation + PDF invoice to an address the
 * customer types. Auto-confirmation already went to the registered email;
 * resending to that same address is skipped for 5 minutes after placedAt.
 */
export async function POST(request: Request, context: RouteContext) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (
			!rateLimit(`orders:email:${ip}`, { limit: 10, windowMs: 60_000 }) ||
			!rateLimit(`orders:email:user:${user.id}`, {
				limit: 6,
				windowMs: 60_000,
			})
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

		const parsed = await parseJsonBody<Body>(request);
		if (!parsed.ok) return parsed.response;

		const confirmation = await getOrderConfirmation(user.id, orderNumber);
		if (!confirmation) {
			return NextResponse.json({ error: "Order not found." }, { status: 404 });
		}
		if (confirmation.paymentStatus !== "paid") {
			return NextResponse.json(
				{ error: "Invoice email is only available for paid orders." },
				{ status: 400 },
			);
		}

		const to = String(parsed.data.email ?? "")
			.trim()
			.toLowerCase();
		if (!to || !isEmail(to) || to.length > FIELD_LIMITS.email) {
			return NextResponse.json(
				{ error: "Enter a valid email address." },
				{ status: 400 },
			);
		}

		const registered = confirmation.customerEmail.trim().toLowerCase();
		if (registered && to === registered) {
			const placedMs = confirmation.placedAt
				? new Date(confirmation.placedAt).getTime()
				: 0;
			const ageMs =
				placedMs > 0 ? Date.now() - placedMs : Number.POSITIVE_INFINITY;
			if (ageMs < REGISTERED_RESEND_COOLDOWN_MS) {
				return NextResponse.json({ ok: true, skipped: true, to });
			}
		}

		const result = await sendOrderConfirmationEmail(confirmation.orderId, to);
		if (!result.ok) {
			return NextResponse.json({ error: result.error }, { status: 502 });
		}

		return NextResponse.json({ ok: true, to: result.to });
	} catch (error) {
		console.error("order email send error", error);
		return NextResponse.json(
			{ error: "Unable to send the invoice email." },
			{ status: 500 },
		);
	}
}
