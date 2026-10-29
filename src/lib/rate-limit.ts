type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Cap map size so a flood of unique keys cannot grow memory unboundedly. */
const MAX_BUCKETS = 10_000;
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweepExpired(now: number): void {
	if (now - lastSweepAt < SWEEP_INTERVAL_MS && buckets.size < MAX_BUCKETS) {
		return;
	}
	lastSweepAt = now;
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
	// If still oversized after eviction, drop oldest entries (Map insertion order).
	if (buckets.size > MAX_BUCKETS) {
		const excess = buckets.size - MAX_BUCKETS;
		let i = 0;
		for (const key of buckets.keys()) {
			if (i++ >= excess) break;
			buckets.delete(key);
		}
	}
}

/**
 * Simple in-memory rate limiter (per process). Fine for single-node / preview;
 * does not coordinate across multiple instances.
 * Returns true when the request is allowed.
 */
export function rateLimit(
	key: string,
	{ limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): boolean {
	const now = Date.now();
	sweepExpired(now);

	const current = buckets.get(key);
	if (!current || current.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}
	if (current.count >= limit) return false;
	current.count += 1;
	return true;
}

/**
 * Resolve client IP for rate limiting.
 * Prefer `x-real-ip` (typically set by the edge to the connecting peer).
 * For `x-forwarded-for`, use the rightmost hop — when a proxy appends the
 * peer address, leftmost entries are client-spoofable.
 * Residual risk: multi-instance deploys need a shared store (Redis/Upstash).
 */
export function clientIp(request: Request): string {
	const realIp = request.headers.get("x-real-ip")?.trim();
	if (realIp) return realIp;

	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const parts = forwarded
			.split(",")
			.map((p) => p.trim())
			.filter(Boolean);
		if (parts.length > 0) return parts[parts.length - 1]!;
	}

	return "unknown";
}
