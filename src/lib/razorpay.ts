import crypto from "crypto";
import Razorpay from "razorpay";

function cleanEnv(value: string | undefined): string {
	if (!value) return "";
	const withoutComment = value.split(/\s+#/)[0] ?? value;
	return withoutComment.trim().replace(/^["']|["']$/g, "");
}

export function getRazorpayKeyId(): string {
	return cleanEnv(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
}

export function getRazorpayKeySecret(): string {
	return cleanEnv(process.env.RAZORPAY_KEY_SECRET);
}

export function assertRazorpayConfigured(): {
	keyId: string;
	keySecret: string;
} {
	const keyId = getRazorpayKeyId();
	const keySecret = getRazorpayKeySecret();
	if (!keyId || !keySecret) {
		throw new Error("Razorpay is not configured");
	}
	return { keyId, keySecret };
}

let client: Razorpay | null = null;
let clientKeyId: string | null = null;

function getClient(): Razorpay {
	const { keyId, keySecret } = assertRazorpayConfigured();
	if (!client || clientKeyId !== keyId) {
		client = new Razorpay({ key_id: keyId, key_secret: keySecret });
		clientKeyId = keyId;
	}
	return client;
}

function isRazorpayAuthError(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const e = error as {
		statusCode?: number;
		error?: { description?: string; code?: string };
	};
	const description = e.error?.description?.toLowerCase() ?? "";
	return e.statusCode === 401 || description.includes("authentication failed");
}

export async function createRazorpayOrder(input: {
	amountPaise: number;
	receipt: string;
	notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
	try {
		const order = await getClient().orders.create({
			amount: input.amountPaise,
			currency: "INR",
			receipt: input.receipt.slice(0, 40),
			notes: input.notes,
		});

		return {
			id: String(order.id),
			amount: Number(order.amount),
			currency: String(order.currency || "INR"),
		};
	} catch (error) {
		if (isRazorpayAuthError(error)) {
			throw new Error("Razorpay authentication failed");
		}
		throw error;
	}
}

/** HMAC-SHA256 of `order_id|payment_id` with the key secret. */
export function verifyPaymentSignature(input: {
	razorpayOrderId: string;
	razorpayPaymentId: string;
	razorpaySignature: string;
}): boolean {
	const { keySecret } = assertRazorpayConfigured();
	const body = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
	const expected = crypto
		.createHmac("sha256", keySecret)
		.update(body)
		.digest("hex");

	const a = Buffer.from(expected, "utf8");
	const b = Buffer.from(input.razorpaySignature.trim(), "utf8");
	if (a.length !== b.length) return false;
	return crypto.timingSafeEqual(a, b);
}
