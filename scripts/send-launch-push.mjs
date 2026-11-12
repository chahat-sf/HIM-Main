/**
 * Broadcast a launch Web Push to every saved push_subscriptions row.
 * Usage: npm run push:launch
 *
 * Requires DB_* + VAPID_* env (from .env or the shell).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import webpush from "web-push";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv() {
	const envPath = path.join(root, ".env");
	if (!fs.existsSync(envPath)) return;
	const text = fs.readFileSync(envPath, "utf8");
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const i = trimmed.indexOf("=");
		if (i === -1) continue;
		const key = trimmed.slice(0, i);
		const value = trimmed.slice(i + 1);
		if (!process.env[key]) process.env[key] = value;
	}
}

const PAYLOAD = {
	title: "HIM World is open",
	body: "The collection is live. Step inside.",
	url: "/",
	icon: "/icons/bag-plus-v2.png",
};

async function main() {
	loadEnv();

	const {
		DB_HOST,
		DB_USER,
		DB_PASS,
		DB_NAME,
		VAPID_PRIVATE_KEY,
		VAPID_SUBJECT,
		NEXT_PUBLIC_VAPID_PUBLIC_KEY,
	} = process.env;

	if (!DB_HOST || !DB_USER || !DB_PASS || !DB_NAME) {
		throw new Error("Missing DB_* env vars");
	}
	if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
		throw new Error("Missing VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)");
	}

	webpush.setVapidDetails(
		VAPID_SUBJECT || "mailto:wegotyou@thehim.in",
		NEXT_PUBLIC_VAPID_PUBLIC_KEY,
		VAPID_PRIVATE_KEY,
	);

	const conn = await mysql.createConnection({
		host: DB_HOST,
		user: DB_USER,
		password: DB_PASS,
		database: DB_NAME,
	});

	const [rows] = await conn.query(
		`SELECT id, email, endpoint, p256dh, auth FROM push_subscriptions`,
	);

	console.log(`Sending launch push to ${rows.length} subscription(s)…`);

	let sent = 0;
	let removed = 0;
	let failed = 0;

	for (const row of rows) {
		const subscription = {
			endpoint: row.endpoint,
			keys: { p256dh: row.p256dh, auth: row.auth },
		};
		try {
			await webpush.sendNotification(subscription, JSON.stringify(PAYLOAD));
			sent += 1;
			console.log(`  ok  #${row.id} ${row.email}`);
		} catch (error) {
			const status = error?.statusCode;
			if (status === 404 || status === 410) {
				await conn.execute(`DELETE FROM push_subscriptions WHERE id = ?`, [
					row.id,
				]);
				removed += 1;
				console.log(`  gone #${row.id} ${row.email} (removed)`);
			} else {
				failed += 1;
				console.error(`  fail #${row.id} ${row.email}`, error?.message || error);
			}
		}
	}

	await conn.end();
	console.log(`Done. sent=${sent} removed=${removed} failed=${failed}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
