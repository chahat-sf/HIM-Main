type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory rate limiter (per process). Fine for single-node / preview.
 * Returns true when the request is allowed.
 */
export function rateLimit(
	key: string,
	{ limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): boolean {
	const now = Date.now();
	const current = buckets.get(key);
	if (!current || current.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}
	if (current.count >= limit) return false;
	current.count += 1;
	return true;
}

export function clientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
	return request.headers.get("x-real-ip")?.trim() || "unknown";
}
