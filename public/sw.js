/* HIM World — Web Push service worker (Coming Soon / launch alerts) */

self.addEventListener("push", (event) => {
	let data = {
		title: "HIM World",
		body: "We're open. Explore the collection.",
		url: "/",
		icon: "/icons/bag-plus-v2.png",
	};

	try {
		if (event.data) {
			const parsed = event.data.json();
			if (parsed && typeof parsed === "object") {
				data = { ...data, ...parsed };
			}
		}
	} catch {
		try {
			const text = event.data?.text();
			if (text) data.body = text;
		} catch {
			/* use defaults */
		}
	}

	event.waitUntil(
		self.registration.showNotification(String(data.title || "HIM World"), {
			body: String(data.body || ""),
			icon: String(data.icon || "/icons/bag-plus-v2.png"),
			badge: String(data.badge || data.icon || "/icons/bag-plus-v2.png"),
			data: { url: String(data.url || "/") },
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const target = String(event.notification.data?.url || "/");
	const absolute = new URL(target, self.location.origin).href;

	event.waitUntil(
		(async () => {
			const clientsList = await self.clients.matchAll({
				type: "window",
				includeUncontrolled: true,
			});
			for (const client of clientsList) {
				if ("focus" in client) {
					await client.focus();
					if ("navigate" in client) {
						try {
							await client.navigate(absolute);
						} catch {
							/* ignore navigate errors */
						}
					}
					return;
				}
			}
			if (self.clients.openWindow) {
				await self.clients.openWindow(absolute);
			}
		})(),
	);
});
