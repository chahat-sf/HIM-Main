import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
	return EMAIL_RE.test(value.trim());
}

/** Default max JSON body size for public / auth APIs (32 KiB). */
export const MAX_JSON_BYTES = 32 * 1024;

/** Larger allowance for cart/wishlist merge payloads. */
export const MAX_MERGE_JSON_BYTES = 128 * 1024;

export const FIELD_LIMITS = {
	fullName: 120,
	phone: 32,
	email: 254,
	password: 128,
	addressLine: 200,
	city: 100,
	state: 100,
	postalCode: 20,
	country: 80,
	addressLabel: 80,
	productSlug: 160,
	productName: 200,
	productImage: 500,
	size: 64,
	color: 64,
	cartQty: 99,
} as const;

/**
 * Read and parse a JSON body with a hard size cap (Content-Length + raw length).
 * Returns a 413/400 NextResponse on failure.
 */
export async function parseJsonBody<T>(
	request: Request,
	maxBytes: number = MAX_JSON_BYTES,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
	const contentLength = request.headers.get("content-length");
	if (contentLength != null) {
		const n = Number(contentLength);
		if (Number.isFinite(n) && n > maxBytes) {
			return {
				ok: false,
				response: NextResponse.json(
					{ error: "Request body is too large." },
					{ status: 413 },
				),
			};
		}
	}

	let text: string;
	try {
		text = await request.text();
	} catch {
		return {
			ok: false,
			response: NextResponse.json(
				{ error: "Unable to read request body." },
				{ status: 400 },
			),
		};
	}

	if (text.length > maxBytes) {
		return {
			ok: false,
			response: NextResponse.json(
				{ error: "Request body is too large." },
				{ status: 413 },
			),
		};
	}

	if (!text.trim()) {
		return {
			ok: false,
			response: NextResponse.json(
				{ error: "Request body is required." },
				{ status: 400 },
			),
		};
	}

	try {
		return { ok: true, data: JSON.parse(text) as T };
	} catch {
		return {
			ok: false,
			response: NextResponse.json(
				{ error: "Invalid JSON body." },
				{ status: 400 },
			),
		};
	}
}

export function tooManyRequests(
	message = "Too many attempts. Please try again shortly.",
): NextResponse {
	return NextResponse.json({ error: message }, { status: 429 });
}
