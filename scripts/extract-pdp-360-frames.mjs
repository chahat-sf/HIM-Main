/**
 * extract-pdp-360-frames.mjs
 * --------------------------
 * Samples each house outfit reel into a 61-frame WebP ring for PDP drag-360.
 *
 *   public/products/videos/{id}-reel.mp4
 *     → public/products/{id}/frames/frame_0001.webp … frame_0061.webp
 *
 * Run:
 *   node scripts/extract-pdp-360-frames.mjs
 *
 * Requires ffmpeg + ffprobe on PATH.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FRAME_COUNT = 61;
const MAX_EDGE = 2520;
const QUALITY = 85;

const OUTFIT_IDS = [
  "nocturne",
  "last-word",
  "composure",
  "archivist",
  "encore",
];

const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
if (ffmpegCheck.error) {
  console.error("[extract-pdp-360] ffmpeg not found on PATH.");
  process.exit(1);
}

function probeDuration(input) {
  const out = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      input,
    ],
    { encoding: "utf8" },
  ).trim();
  const duration = Number(out);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not probe duration for ${input}`);
  }
  return duration;
}

for (const id of OUTFIT_IDS) {
  const input = join(ROOT, "public", "products", "videos", `${id}-reel.mp4`);
  if (!existsSync(input)) {
    console.warn(`[extract-pdp-360] Skipping ${id} — missing ${input}`);
    continue;
  }

  const outDir = join(ROOT, "public", "products", id, "frames");
  mkdirSync(outDir, { recursive: true });

  // Clear previous ring so counts stay exact.
  for (const name of readdirSync(outDir)) {
    if (/^frame_\d+\.webp$/i.test(name)) {
      rmSync(join(outDir, name));
    }
  }

  const duration = probeDuration(input);
  // Evenly sample FRAME_COUNT frames across the clip.
  const fps = FRAME_COUNT / duration;

  console.log(`\n[extract-pdp-360] ${id}`);
  console.log(`  source: ${input} (${duration.toFixed(3)}s)`);
  console.log(`  out:    ${outDir}`);
  console.log(`  fps:    ${fps.toFixed(4)} → ${FRAME_COUNT} frames`);

  const vf = [
    `fps=${fps}`,
    `scale='if(gt(iw,ih),min(${MAX_EDGE},iw),-1)':'if(gt(ih,iw),min(${MAX_EDGE},ih),-1)':flags=lanczos`,
  ].join(",");

  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        input,
        "-vf",
        vf,
        "-frames:v",
        String(FRAME_COUNT),
        "-c:v",
        "libwebp",
        "-quality",
        String(QUALITY),
        "-lossless",
        "0",
        join(outDir, "frame_%04d.webp"),
      ],
      { stdio: "inherit" },
    );
  } catch {
    console.error(`[extract-pdp-360] ffmpeg failed for ${id}`);
    process.exit(1);
  }

  const frames = readdirSync(outDir)
    .filter((f) => /^frame_\d+\.webp$/i.test(f))
    .sort();
  console.log(`[extract-pdp-360] ✓ ${id}: ${frames.length} frames`);
  if (frames.length !== FRAME_COUNT) {
    console.warn(
      `[extract-pdp-360] Expected ${FRAME_COUNT}, got ${frames.length} for ${id}`,
    );
  }
}

console.log("\n[extract-pdp-360] Done.\n");
