/** Client-only helpers for Coming Soon Web Push. */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(base64);
	const output = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) {
		output[i] = raw.charCodeAt(i);
	}
	return output;
}

export function isWebPushSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		"Notification" in window &&
		"serviceWorker" in navigator &&
		"PushManager" in window
	);
}

/** Request notification permission from a user gesture. Safe no-op if unsupported. */
export async function requestNotificationPermission(): Promise<
	NotificationPermission | "unsupported"
> {
	if (!isWebPushSupported()) return "unsupported";
	try {
		return await Notification.requestPermission();
	} catch {
		return "unsupported";
	}
}

/**
 * Register the SW, subscribe with VAPID, and POST the subscription.
 * Best-effort: returns false on any failure without throwing.
 */
export async function subscribeWebPush(email: string): Promise<boolean> {
	if (!isWebPushSupported()) return false;
	if (Notification.permission !== "granted") return false;

	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
	if (!publicKey) return false;

	const normalizedEmail = email.trim().toLowerCase();
	if (!normalizedEmail) return false;

	try {
		const registration = await navigator.serviceWorker.register("/sw.js", {
			scope: "/",
		});
		await navigator.serviceWorker.ready;

		let subscription = await registration.pushManager.getSubscription();
		if (!subscription) {
			subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
			});
		}

		const res = await fetch("/api/push/subscribe", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: normalizedEmail,
				subscription: subscription.toJSON(),
			}),
		});
		return res.ok;
	} catch {
		return false;
	}
}
