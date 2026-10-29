import posthog from "posthog-js";

/** Read at call-time so Next inlines NEXT_PUBLIC_* into the client bundle reliably. */
function cleanEnv(value: string | undefined): string {
	if (!value) return "";
	// Strip accidental inline comments from .env values
	const withoutComment = value.split(/\s+#/)[0] ?? value;
	return withoutComment.trim().replace(/^["']|["']$/g, "");
}

export function getPostHogKey(): string {
	return cleanEnv(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function getPostHogHost(): string {
	return (
		cleanEnv(process.env.NEXT_PUBLIC_POSTHOG_HOST) || "https://us.i.posthog.com"
	);
}

export function isAnalyticsEnabled(): boolean {
	return Boolean(getPostHogKey());
}

export type AnalyticsProps = Record<
	string,
	string | number | boolean | null | undefined
>;

/**
 * Named product-analytics events. Prefer these over relying only on autocapture
 * for funnels you care about (cart, auth, checkout).
 *
 * Future checkout:
 *   track("order_completed", {
 *     order_id, revenue, currency: "INR", user_id
 *   })
 */
export type AnalyticsEvent =
	| "signed_up"
	| "logged_in"
	| "logged_out"
	| "product_viewed"
	| "add_to_cart"
	| "remove_from_cart"
	| "cart_updated"
	| "wishlist_toggled"
	| "checkout_clicked"
	| "contact_submitted"
	| "newsletter_subscribed"
	| "search_used"
	| "order_completed";

const PRODUCT_VIEW_DEDUPE_MS = 1000;

let identifiedId: string | null = null;
let identifiedFingerprint: string | null = null;
let initStarted = false;
let lastPageviewPath: string | null = null;
let lastProductViewSlug: string | null = null;
let lastProductViewAt = 0;

export function initAnalytics(): boolean {
	if (typeof window === "undefined") return false;
	const key = getPostHogKey();
	if (!key) return false;
	if (initStarted) return true;
	initStarted = true;

	posthog.init(key, {
		api_host: getPostHogHost(),
		autocapture: true,
		capture_pageview: false,
		capture_pageleave: true,
		person_profiles: "identified_only",
		persistence: "localStorage+cookie",
		// Helps diagnose missing network calls in local dev
		loaded: (ph) => {
			if (process.env.NODE_ENV === "development") {
				ph.debug();
			}
		},
	});
	posthog.register({ app: "him-web" });
	return true;
}

function withPosthog(fn: () => void): void {
	if (!isAnalyticsEnabled() || typeof window === "undefined") return;
	try {
		initAnalytics();
		fn();
	} catch {
		/* analytics must never break UX */
	}
}

export function track(
	event: AnalyticsEvent,
	properties?: AnalyticsProps,
): void {
	withPosthog(() => {
		if (event === "product_viewed") {
			const slug = String(properties?.slug ?? "");
			const now = Date.now();
			if (
				slug &&
				slug === lastProductViewSlug &&
				now - lastProductViewAt < PRODUCT_VIEW_DEDUPE_MS
			) {
				return;
			}
			lastProductViewSlug = slug || lastProductViewSlug;
			lastProductViewAt = now;
		}
		posthog.capture(event, properties);
	});
}

export function identifyUser(user: {
	id: number;
	email: string;
	fullName: string;
}): void {
	const id = String(user.id);
	const fingerprint = `${id}|${user.email}|${user.fullName}`;
	if (identifiedId === id && identifiedFingerprint === fingerprint) {
		return;
	}
	withPosthog(() => {
		posthog.identify(id, {
			email: user.email,
			name: user.fullName,
		});
		identifiedId = id;
		identifiedFingerprint = fingerprint;
	});
}

export function resetAnalyticsUser(): void {
	if (!identifiedId) return;
	withPosthog(() => {
		posthog.reset();
		identifiedId = null;
		identifiedFingerprint = null;
		lastPageviewPath = null;
		lastProductViewSlug = null;
		lastProductViewAt = 0;
	});
}

export function capturePageview(path: string): void {
	withPosthog(() => {
		if (path === lastPageviewPath) return;
		lastPageviewPath = path;
		posthog.capture("$pageview", {
			$path: path,
			path,
			referrer: document.referrer || undefined,
		});
	});
}
