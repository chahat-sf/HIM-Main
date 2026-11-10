import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { CheckoutError, verifyCheckoutPayment } from "@/lib/checkout";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseJsonBody, tooManyRequests } from "@/lib/validation";

type VerifyBody = {
	razorpayOrderId?: string;
	razorpayPaymentId?: string;
	razorpaySignature?: string;
};

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		const ip = clientIp(request);

		if (
			!rateLimit(`checkout:verify:${ip}`, { limit: 30, windowMs: 60_000 }) ||
			(user &&
				!rateLimit(`checkout:verify:user:${user.id}`, {
					limit: 20,
					windowMs: 60_000,
				}))
		) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<VerifyBody>(request);
		if (!parsed.ok) return parsed.response;
		const body = parsed.data;

		const razorpayOrderId = body.razorpayOrderId?.trim() ?? "";
		const razorpayPaymentId = body.razorpayPaymentId?.trim() ?? "";
		const razorpaySignature = body.razorpaySignature?.trim() ?? "";

		if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
			return NextResponse.json(
				{ error: "Missing payment verification fields." },
				{ status: 400 },
			);
		}

		const result = await verifyCheckoutPayment(
			{
				razorpayOrderId,
				razorpayPaymentId,
				razorpaySignature,
			},
			user,
		);

		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof CheckoutError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("checkout verify error", error);
		return NextResponse.json(
			{ error: "Unable to verify payment." },
			{ status: 500 },
		);
	}
}
