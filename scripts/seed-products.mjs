/**
 * Upserts the HIM product catalog into MySQL.
 * Source of truth after seed: the database (Workbench / SQL). No products.json.
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

/** Empty until real colorways are added in Workbench */
const DEFAULT_COLORS = [];
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const DEFAULT_SHIP =
  "Free standard shipping on orders above ₹3,000. Express delivery available at checkout. Hassle-free 30-day returns.";

/** @type {Array<Record<string, unknown>>} */
const PRODUCTS = [
  {
    id: 1,
    slug: "textured-thermal-white-9",
    name: "THE NOCTURNE",
    title: "Black Embellished Velvet Jacket",
    fabric: "Premium Korean velvet",
    description:
      "Black Embellished Velvet Jacket combines a rich black finish with intricate embellishments, creating an elegant, understated statement inspired by the mystery and sophistication of midnight.",
    marketingLine: "For the hours that belong to him.",
    alternatives: ["The Velvet Hour", "The Nightfall", "The Midnight Affair"],
    details: [
      "Premium Korean velvet",
      "Rich black colour",
      "Intricate embellishment detailing",
      "Soft, refined texture",
      "Elegant, sophisticated finish",
      "Designed for a polished evening look",
      "A balance of midnight mystery and timeless elegance",
    ],
    category: "JACKETS",
    image: "/products/inner-images/man-image-102-1.webp",
    images: [
      "/products/inner-images/man-image-102-1.webp",
      "/products/inner-images/man-image-102-2.webp",
      "/products/inner-images/man-image-102-3.webp",
    ],
    priceCents: 4200000,
    colors: DEFAULT_COLORS,
    sizes: DEFAULT_SIZES,
    sizeFit:
      "A refined evening silhouette designed to make a statement through understated authority.",
    shipping: DEFAULT_SHIP,
    pdpLayout: "single",
  },
  {
    id: 2,
    slug: "textured-thermal-white-12",
    name: "THE LAST WORD",
    title: "Black Evening Tuxedo",
    fabric: "All-weather Merino wool blend",
    description:
      "The Black Evening Tuxedo embodies understated authority and timeless sophistication. Defined by its sharp tailoring and sleek black finish, it makes a lasting impression without demanding attention.",
    marketingLine: "Some statements are made in silence.",
    alternatives: ["The Final Act", "The Black Chapter", "The Authority"],
    details: [
      "Premium all-weather Merino wool blend",
      "Sharp, structured tailoring",
      "Classic black finish",
      "Refined eveningwear silhouette",
      "Clean, sophisticated detailing",
      "Designed for a polished, commanding appearance",
      "Timeless style with understated elegance",
    ],
    category: "SUITS",
    image: "/products/inner-images/man-image-106-1.webp",
    images: [
      "/products/inner-images/man-image-106-3.webp",
      "/products/inner-images/man-image-106-2.webp",
      "/products/inner-images/man-image-106-1.webp",
    ],
    priceCents: 3600000,
    colors: DEFAULT_COLORS,
    sizes: DEFAULT_SIZES,
    sizeFit: "Slim fit. Model is 6'0\" wearing size M. True to size.",
    shipping: DEFAULT_SHIP,
    pdpLayout: "single",
  },
  {
    id: 3,
    slug: "textured-thermal-white-11",
    name: "THE COMPOSURE",
    title: "Black Cotton-Velvet Structured Jacket",
    fabric: "Cotton velvet",
    description:
      "The Black Cotton-Velvet Structured Jacket embodies quiet confidence and understated authority. Its sharp silhouette and deep black finish create a sophisticated look that speaks through presence, not performance.",
    marketingLine: "Presence without performance.",
    alternatives: ["The Sentinel", "The Stillness", "The Quiet Authority"],
    details: [
      "Premium cotton velvet",
      "Refined, textured finish",
      "Structured silhouette",
      "Classic black colour",
      "Sharp, understated design",
      "Tailored for a polished appearance",
      "A balance of quiet confidence and modern sophistication",
    ],
    category: "JACKETS",
    image: "/products/inner-images/man-image-104-3.webp",
    images: [
      "/bestseller/bs-image-5.webp",
      "/products/inner-images/man-image-104-1.webp",
      "/products/inner-images/man-image-104-2.webp",
      "/products/inner-images/man-image-104-3.webp",
    ],
    priceCents: 5200000,
    colors: DEFAULT_COLORS,
    sizes: DEFAULT_SIZES,
    sizeFit: "A structured silhouette with a sharp, understated profile.",
    shipping: DEFAULT_SHIP,
    pdpLayout: "single",
  },
  {
    id: 4,
    slug: "textured-thermal-white-10",
    name: "THE ARCHIVIST",
    title: "Houndstooth Wool Overcoat",
    fabric: "Wool blend",
    description:
      "The Houndstooth Wool Overcoat blends heritage-inspired tailoring with timeless sophistication. Its distinctive pattern and refined silhouette reflect a sense of history, character and enduring style.",
    marketingLine: "Some things never belonged to just one era.",
    alternatives: ["The Heirloom", "The Collector", "The Heritage"],
    details: [
      "Premium wool blend",
      "Classic houndstooth pattern",
      "Refined, structured silhouette",
      "Heritage-inspired design",
      "Rich, timeless colour palette",
      "Tailored for a polished appearance",
      "A blend of traditional elegance and modern sophistication",
    ],
    category: "OUTERWEAR",
    image: "/products/man-image-101.webp",
    images: [
      "/products/man-image-103.webp",
      "/products/inner-images/man-image-103-1.jpg",
      "/products/inner-images/man-image-103-2.jpg",
      "/products/inner-images/man-image-103-3.webp",
      "/products/inner-images/man-image-103-4.webp",
    ],
    priceCents: 4400000,
    colors: DEFAULT_COLORS,
    sizes: DEFAULT_SIZES,
    sizeFit:
      "A timeless overcoat silhouette designed for a refined, heritage-inspired look.",
    shipping: DEFAULT_SHIP,
    pdpLayout: "single",
  },
  {
    id: 5,
    slug: "textured-thermal-white-8",
    name: "THE EXCEPTION",
    title: "Double-Breasted Tailored Denim Suit",
    fabric: "Premium 10 oz denim with cotton blend and stretch",
    description:
      "The Double-Breasted Tailored Denim Suit redefines traditional tailoring by pairing the familiar character of denim with a sharp, formal silhouette. A contemporary statement for those who prefer style beyond convention.",
    marketingLine: "Tailoring, outside the rulebook.",
    alternatives: ["The Maverick", "The Renegade", "The Unconventional"],
    details: [
      "Premium 10 oz denim",
      "Cotton-rich blended fabric",
      "Added stretch for flexibility",
      "Double-breasted design",
      "Structured, tailored silhouette",
      "Classic denim character with a formal finish",
      "A modern interpretation of conventional suiting",
    ],
    category: "SUITS",
    image: "/products/man-image-109.webp",
    images: [
      "/bestseller/bs-image-2.webp",
      "/products/inner-images/man-image-101-1.webp",
      "/products/inner-images/man-image-101-2.webp",
      "/products/inner-images/man-image-101-3.webp",
    ],
    priceCents: 3600000,
    colors: DEFAULT_COLORS,
    sizes: DEFAULT_SIZES,
    sizeFit:
      "A structured double-breasted silhouette that blends denim's relaxed character with formal tailoring.",
    shipping: DEFAULT_SHIP,
    pdpLayout: "single",
  },
  {
    id: 6,
    slug: "textured-thermal-white-7",
    name: "THE ATTACHÉ",
    title: "Dark Double-Breasted Tailored Blazer",
    fabric: "Terry rayon blend",
    description:
      "The Dark Double-Breasted Tailored Blazer combines refined tailoring with a commanding silhouette. Its dark finish and double-breasted design create a polished look inspired by worldly sophistication and timeless elegance.",
    marketingLine: "Well travelled. Never out of place.",
    alternatives: ["The Correspondent", "The Statesman", "The Consul"],
    details: [
      "Terry rayon blend",
      "Dark, refined finish",
      "Double-breasted design",
      "Structured, tailored silhouette",
      "Classic formal styling",
      "Sharp and sophisticated detailing",
      "A polished look inspired by modern diplomacy and timeless elegance",
    ],
    category: "BLAZERS",
    image: "/products/inner-images/man-image-100-2.jpg",
    images: [
      "/products/man-image-100.webp",
      "/products/inner-images/man-image-100-1.webp",
      "/products/inner-images/man-image-100-2.jpg",
    ],
    priceCents: 3800000,
    colors: DEFAULT_COLORS,
    sizes: DEFAULT_SIZES,
    sizeFit:
      "A sharp, tailored silhouette designed for a refined and sophisticated look.",
    shipping: DEFAULT_SHIP,
    pdpLayout: "single",
  },
];

async function main() {
  loadEnv();
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    namedPlaceholders: true,
  });

  for (const p of PRODUCTS) {
    const swatches = p.colors.map((c) => c.hex);
    await conn.execute(
      `INSERT INTO products
        (id, slug, name, title, fabric, description, marketing_line,
         alternatives_json, details_json, category, image_url, images_json,
         price_cents, swatches_json, colors_json, sizes_json, size_fit,
         shipping, pdp_layout)
       VALUES
        (:id, :slug, :name, :title, :fabric, :description, :marketingLine,
         CAST(:alternatives AS JSON), CAST(:details AS JSON), :category, :image,
         CAST(:images AS JSON), :priceCents, CAST(:swatches AS JSON),
         CAST(:colors AS JSON), CAST(:sizes AS JSON), :sizeFit, :shipping,
         :pdpLayout)
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
         images_json = VALUES(images_json),
         price_cents = VALUES(price_cents),
         swatches_json = VALUES(swatches_json),
         colors_json = VALUES(colors_json),
         sizes_json = VALUES(sizes_json),
         size_fit = VALUES(size_fit),
         shipping = VALUES(shipping),
         pdp_layout = VALUES(pdp_layout)`,
      {
        id: p.id,
        slug: p.slug,
        name: p.name,
        title: p.title,
        fabric: p.fabric,
        description: p.description,
        marketingLine: p.marketingLine,
        alternatives: JSON.stringify(p.alternatives),
        details: JSON.stringify(p.details),
        category: p.category,
        image: p.image,
        images: JSON.stringify(p.images),
        priceCents: p.priceCents,
        swatches: JSON.stringify(swatches),
        colors: JSON.stringify(p.colors),
        sizes: JSON.stringify(p.sizes),
        sizeFit: p.sizeFit,
        shipping: p.shipping,
        pdpLayout: p.pdpLayout,
      },
    );
  }

  const [rows] = await conn.query(
    "SELECT id, slug, name, pdp_layout, price_cents FROM products ORDER BY id",
  );
  console.log(`Seeded ${rows.length} products from embedded catalog:`);
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
