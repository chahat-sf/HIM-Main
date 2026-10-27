/**
 * Optimize catalog PDP masters to balanced WebP.
 * Usage: node scripts/optimize-product-images.mjs
 *
 * - Max long edge 2800px (no upscale)
 * - WebP quality 95, effort 6
 * Prefer restoring from source over repeated lossy re-encodes
 * - JPG/PNG → sibling .webp (original left in place; update seed separately)
 * - Skips cards/ and videos
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

const MAX_EDGE = 2800;
const WEBP_QUALITY = 95;
const WEBP_EFFORT = 6;

function toAbs(pubPath) {
  return path.join(PUBLIC, pubPath.replace(/^\//, ""));
}

function toWebpPub(pubPath) {
  return pubPath.replace(/\.(jpe?g|png)$/i, ".webp");
}

async function collectPaths() {
  const set = new Set();

  try {
    const seed = await fs.readFile(SEED, "utf8");
    for (const m of seed.matchAll(
      /"(\/(?:products|THE-[A-Z0-9-]+|bestseller)\/[^"]+\.(?:webp|jpe?g|png))"/gi,
    )) {
      set.add(m[1]);
    }
  } catch {
    /* optional */
  }

  return [...set].sort();
}

async function optimizeOne(pubPath) {
  if (/\.(mp4|webm|gif)$/i.test(pubPath)) return null;
  if (pubPath.includes("/cards/")) return null;

  const srcAbs = toAbs(pubPath);
  try {
    await fs.access(srcAbs);
  } catch {
    console.warn(`skip missing: ${pubPath}`);
    return null;
  }

  const outPub = toWebpPub(pubPath);
  const outAbs = toAbs(outPub);
  await fs.mkdir(path.dirname(outAbs), { recursive: true });

  const before = (await fs.stat(srcAbs)).size;
  const meta = await sharp(srcAbs).metadata();
  const longEdge = Math.max(meta.width || 0, meta.height || 0);
  const needsResize = longEdge > MAX_EDGE;

  let pipeline = sharp(srcAbs).rotate();
  if (needsResize) {
    pipeline = pipeline.resize({
      width: meta.width >= meta.height ? MAX_EDGE : undefined,
      height: meta.height > meta.width ? MAX_EDGE : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Write to temp then rename so in-place .webp sources don't truncate mid-read
  const tmpAbs = `${outAbs}.tmp-${process.pid}`;
  await pipeline.webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT }).toFile(tmpAbs);
  await fs.rename(tmpAbs, outAbs);

  const after = (await fs.stat(outAbs)).size;
  const outMeta = await sharp(outAbs).metadata();
  console.log(
    `${pubPath} → ${outPub}  ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB  ` +
      `${meta.width}x${meta.height} → ${outMeta.width}x${outMeta.height}`,
  );

  return { from: pubPath, to: outPub, before, after };
}

async function main() {
  const paths = await collectPaths();
  console.log(`Optimizing ${paths.length} catalog image path(s)…\n`);
  let ok = 0;
  const remaps = [];

  for (const pub of paths) {
    const result = await optimizeOne(pub);
    if (!result) continue;
    ok += 1;
    if (result.from !== result.to) remaps.push(result);
  }

  console.log(`\nDone. Optimized ${ok} image(s).`);
  if (remaps.length) {
    console.log("\nPath remaps (update seed-products.mjs):");
    for (const r of remaps) console.log(`  ${r.from} → ${r.to}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
