/**
 * Build listing-card WebPs under public/products/cards/ from catalog image paths.
 * Usage: node scripts/generate-card-images.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const PRODUCTS_JSON = path.join(ROOT, "src/data/products.json");
const MAX_WIDTH = 900;
const WEBP_QUALITY = 72;

async function walkProductFiles(dir, basePublic = "/products") {
  const sources = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "cards") continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sources.push(
        ...(await walkProductFiles(abs, `${basePublic}/${entry.name}`)),
      );
      continue;
    }
    if (!/\.(webp|jpe?g|png)$/i.test(entry.name)) continue;
    sources.push(`${basePublic}/${entry.name}`);
  }
  return sources;
}

async function collectSources() {
  const sources = new Set();

  try {
    const raw = JSON.parse(await fs.readFile(PRODUCTS_JSON, "utf8"));
    for (const product of raw) {
      if (typeof product.image === "string" && product.image.startsWith("/products/")) {
        sources.add(product.image);
      }
      if (Array.isArray(product.images)) {
        for (const src of product.images) {
          if (typeof src === "string" && src.startsWith("/products/")) {
            sources.add(src);
          }
        }
      }
    }
  } catch {
    /* products.json optional */
  }

  // Full tree so hover galleries have card-sized frames for every still.
  const productsDir = path.join(PUBLIC, "products");
  for (const src of await walkProductFiles(productsDir)) {
    sources.add(src);
  }

  return [...sources].sort();
}

function cardPublicPath(src) {
  const rest = src.replace(/^\/products\//, "");
  const parsed = path.parse(rest);
  const outRel = path.join(parsed.dir, `${parsed.name}.webp`);
  return {
    outRel: outRel.split(path.sep).join("/"),
    outAbs: path.join(PUBLIC, "products", "cards", outRel),
    srcAbs: path.join(PUBLIC, src.replace(/^\//, "")),
  };
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function main() {
  const sources = await collectSources();
  let ok = 0;
  let skipped = 0;

  for (const src of sources) {
    const { outAbs, srcAbs, outRel } = cardPublicPath(src);
    try {
      await fs.access(srcAbs);
    } catch {
      console.warn(`skip missing: ${src}`);
      skipped += 1;
      continue;
    }

    await ensureDir(outAbs);
    const meta = await sharp(srcAbs).metadata();
    const width = meta.width && meta.width > MAX_WIDTH ? MAX_WIDTH : meta.width;

    await sharp(srcAbs)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(outAbs);

    const before = (await fs.stat(srcAbs)).size;
    const after = (await fs.stat(outAbs)).size;
    console.log(
      `${src} → /products/cards/${outRel}  (${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB)`,
    );
    ok += 1;
  }

  console.log(`\nDone. Generated ${ok} card image(s), skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
