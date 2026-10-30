import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { CheckoutError, createCheckoutOrder } from "@/lib/checkout";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseJsonBody, tooManyRequests } from "@/lib/validation";

type CreateBody = {
	addressId?: number;
};

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const ip = clientIp(request);
		if (
			!rateLimit(`checkout:create:${ip}`, { limit: 20, windowMs: 60_000 }) ||
			!rateLimit(`checkout:create:user:${user.id}`, {
				limit: 10,
				windowMs: 60_000,
			})
		) {
			return tooManyRequests();
		}

		const parsed = await parseJsonBody<CreateBody>(request);
		if (!parsed.ok) return parsed.response;

		const addressId = Number(parsed.data.addressId);
		if (!Number.isFinite(addressId) || addressId <= 0) {
			return NextResponse.json(
				{ error: "A shipping address is required." },
				{ status: 400 },
			);
		}

		const result = await createCheckoutOrder(user, addressId);
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
