/**
 * Generate progressive product image tiers (high / mid / low) as WebP.
 * Usage: node scripts/generate-image-tiers.mjs
 *
 * High — catalog path as .webp, max long edge 2400, q85
 * Mid  — /products/mid/..., max width 1200, q80
 * Low  — /products/low/..., max width 64, q75
 *
 * After a successful high WebP write, deletes oversized PNG/JPEG sources.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const SEED = path.join(ROOT, "scripts/seed-products.mjs");

const HIGH_MAX_EDGE = 2400;
const MID_MAX_WIDTH = 1200;
const LOW_MAX_WIDTH = 64;
const HIGH_QUALITY = 85;
const MID_QUALITY = 80;
const LOW_QUALITY = 75;
const WEBP_EFFORT = 4;

const SKIP_DIRS = new Set(["mid", "low", "cards", "videos"]);

function toAbs(pubPath) {
  return path.join(PUBLIC, pubPath.replace(/^\//, ""));
}

function toWebpPub(pubPath) {
  return pubPath.replace(/\.(jpe?g|png)$/i, ".webp");
}

function relativeUnderProducts(pubPath) {
  return pubPath.replace(/^\/products\//, "").replace(/\.(jpe?g|png|webp)$/i, ".webp");
}

function midPub(highPub) {
  return `/products/mid/${relativeUnderProducts(highPub)}`;
}

function lowPub(highPub) {
  return `/products/low/${relativeUnderProducts(highPub)}`;
}

async function walkProductFiles(dir, basePublic = "/products") {
  const sources = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return sources;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
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
    const seed = await fs.readFile(SEED, "utf8");
    for (const m of seed.matchAll(
      /"(\/(?:products|THE-[A-Z0-9-]+|bestseller)\/[^"]+\.(?:webp|jpe?g|png))"/gi,
    )) {
      const p = m[1];
      if (p.includes("/mid/") || p.includes("/low/") || p.includes("/cards/")) {
        continue;
      }
      sources.add(p);
    }
  } catch {
    /* seed optional */
  }

  const productsDir = path.join(PUBLIC, "products");
  for (const src of await walkProductFiles(productsDir)) {
    sources.add(src);
  }

  return [...sources].sort();
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeWebp(srcAbs, outAbs, { maxWidth, maxEdge, quality }) {
  await ensureDir(outAbs);
  const meta = await sharp(srcAbs).metadata();
  let pipeline = sharp(srcAbs).rotate();

  if (maxEdge) {
    const longEdge = Math.max(meta.width || 0, meta.height || 0);
    if (longEdge > maxEdge) {
      pipeline = pipeline.resize({
        width: (meta.width || 0) >= (meta.height || 0) ? maxEdge : undefined,
        height: (meta.height || 0) > (meta.width || 0) ? maxEdge : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
  } else if (maxWidth && meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({
      width: maxWidth,
      withoutEnlargement: true,
    });
  }

  const tmpAbs = `${outAbs}.tmp-${process.pid}`;
  await pipeline.webp({ quality, effort: WEBP_EFFORT }).toFile(tmpAbs);
  await fs.rename(tmpAbs, outAbs);
}

async function processOne(pubPath) {
  if (/\.(mp4|webm|gif)$/i.test(pubPath)) return null;
  if (
    pubPath.includes("/mid/") ||
    pubPath.includes("/low/") ||
    pubPath.includes("/cards/") ||
    pubPath.includes("/videos/")
  ) {
    return null;
  }

  const srcAbs = toAbs(pubPath);
  try {
    await fs.access(srcAbs);
  } catch {
    console.warn(`skip missing: ${pubPath}`);
    return null;
  }

  const highPub = toWebpPub(pubPath);
  const highAbs = toAbs(highPub);
  const midAbs = toAbs(midPub(highPub));
  const lowAbs = toAbs(lowPub(highPub));

  const before = (await fs.stat(srcAbs)).size;

  // Prefer reading the original when converting PNG/JPEG → WebP high.
  // If source is already .webp, re-encode in place via temp.
  await writeWebp(srcAbs, highAbs, {
    maxEdge: HIGH_MAX_EDGE,
    quality: HIGH_QUALITY,
  });
  await writeWebp(highAbs, midAbs, {
    maxWidth: MID_MAX_WIDTH,
    quality: MID_QUALITY,
  });
  await writeWebp(highAbs, lowAbs, {
    maxWidth: LOW_MAX_WIDTH,
    quality: LOW_QUALITY,
  });

  const after = (await fs.stat(highAbs)).size;
  const midSize = (await fs.stat(midAbs)).size;
  const lowSize = (await fs.stat(lowAbs)).size;

  let deleted = null;
  if (/\.(jpe?g|png)$/i.test(pubPath) && highPub !== pubPath) {
    await fs.unlink(srcAbs);
    deleted = pubPath;
  }

  console.log(
    `${pubPath} → ${highPub}  ${Math.round(before / 1024)}KB → high ${Math.round(after / 1024)}KB / mid ${Math.round(midSize / 1024)}KB / low ${Math.round(lowSize / 1024)}KB` +
      (deleted ? `  (deleted ${deleted})` : ""),
  );

  return { from: pubPath, to: highPub, deleted };
}

async function main() {
  const sources = await collectSources();
  // Prefer non-webp sources when both exist so we convert from original once.
  // Deduplicate by high path: keep png/jpg over webp for same stem.
  const byHigh = new Map();
  for (const src of sources) {
    const high = toWebpPub(src);
    const prev = byHigh.get(high);
    if (!prev) {
      byHigh.set(high, src);
      continue;
    }
    const prevIsRaster = /\.(jpe?g|png)$/i.test(prev);
    const curIsRaster = /\.(jpe?g|png)$/i.test(src);
    if (curIsRaster && !prevIsRaster) byHigh.set(high, src);
  }

  const unique = [...byHigh.values()].sort();
  console.log(`Generating tiers for ${unique.length} image(s)…\n`);

  let ok = 0;
  const remaps = [];

  for (const pub of unique) {
    const result = await processOne(pub);
    if (!result) continue;
    ok += 1;
    if (result.from !== result.to) remaps.push(result);
  }

  console.log(`\nDone. Generated tiers for ${ok} image(s).`);
  if (remaps.length) {
    console.log("\nPath remaps (update seed / DB):");
    for (const r of remaps) console.log(`  ${r.from} → ${r.to}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
