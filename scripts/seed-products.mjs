import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

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

function parsePriceCents(price) {
  const raw = String(price ?? "0").replace(/[^\d.]/g, "");
  const rupees = Number(raw) || 0;
  return Math.round(rupees * 100);
}

async function main() {
  loadEnv();
  const products = JSON.parse(
    fs.readFileSync(path.join(root, "src/data/products.json"), "utf8"),
  );

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    namedPlaceholders: true,
  });

  for (const p of products) {
    await conn.execute(
      `INSERT INTO products
        (id, slug, name, title, fabric, description, marketing_line,
         alternatives_json, details_json, category, image_url, price_cents, swatches_json)
       VALUES
        (:id, :slug, :name, :title, :fabric, :description, :marketingLine,
         CAST(:alternatives AS JSON), CAST(:details AS JSON), :category, :image,
         :priceCents, CAST(:swatches AS JSON))
       ON DUPLICATE KEY UPDATE
         slug = VALUES(slug),
         name = VALUES(name),
         title = VALUES(title),
         fabric = VALUES(fabric),
         description = VALUES(description),
         marketing_line = VALUES(marketing_line),
         alternatives_json = VALUES(alternatives_json),
         details_json = VALUES(details_json),
         category = VALUES(category),
         image_url = VALUES(image_url),
         price_cents = VALUES(price_cents),
         swatches_json = VALUES(swatches_json)`,
      {
        id: p.id,
        slug: p.slug,
        name: p.name,
        title: p.title,
        fabric: p.fabric ?? null,
        description: p.description ?? null,
        marketingLine: p.marketingLine ?? null,
        alternatives: JSON.stringify(p.alternatives ?? []),
        details: JSON.stringify(p.details ?? []),
        category: p.category ?? null,
        image: p.image,
        priceCents: parsePriceCents(p.price),
        swatches: JSON.stringify(p.swatches ?? []),
      },
    );
  }

  const [rows] = await conn.query(
    "SELECT id, slug, name FROM products ORDER BY id",
  );
  console.log(`Seeded ${rows.length} products:`);
  for (const row of rows) {
    console.log(`  #${row.id} ${row.slug} — ${row.name}`);
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
