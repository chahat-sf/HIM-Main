/**
 * Product catalog is managed in MySQL (Workbench / SQL), not from this file.
 * Running this script does not write product rows — it will not overwrite DB content.
 */
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env");
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

async function main() {
  loadEnv();
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [rows] = await conn.query(
    "SELECT id, slug, name, pdp_layout, price_cents FROM products ORDER BY id",
  );
  console.log(
    "No embedded catalog seed. Product content lives in MySQL — nothing was written.",
  );
  console.log(`Current products in DB (${rows.length}):`);
  for (const row of rows) {
    console.log(
      `  #${row.id} ${row.slug} — ${row.name} [${row.pdp_layout}] ₹${(row.price_cents / 100).toLocaleString("en-IN")}`,
    );
  }
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
