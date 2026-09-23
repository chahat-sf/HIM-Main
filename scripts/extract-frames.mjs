/**
 * extract-frames.mjs
 * ------------------
 * Converts public/videos/video-1.mp4 (and any other clips you add to
 * the CLIPS array) into a numbered WebP frame sequence at 24fps, placing
 * the frames at:
 *
 *   public/homepage/character-frames/<folder>/frame-000.webp
 *   public/homepage/character-frames/<folder>/frame-001.webp
 *   …
 *
 * Run once (or whenever a source clip changes):
 *   node scripts/extract-frames.mjs
 *
 * Requires ffmpeg to be on PATH.
 * After running, update the `frameCount` value in ScrollSection.tsx
 * for each clip (the script prints it).
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Check ffmpeg is available ─────────────────────────────────────────────────
const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
if (ffmpegCheck.error) {
  console.error("[extract-frames] ffmpeg not found on PATH. Install it first.");
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────────────────────────

const FPS = 24;
/** WebP quality: 0–100 */
const QUALITY = 85;

/**
 * Each entry maps a source clip to an output folder name.
 * Add more clips here as real character footage arrives.
 */
const CLIPS = [
  {
    input: join(ROOT, "public", "videos", "video-1.mp4"),
    folder: "video-1",
  },
];

// ── Extract frames ─────────────────────────────────────────────────────────────

for (const { input, folder } of CLIPS) {
  if (!existsSync(input)) {
    console.warn(`[extract-frames] Skipping "${input}" — file not found.`);
    continue;
  }

  const outDir = join(ROOT, "public", "homepage", "character-frames", folder);
  mkdirSync(outDir, { recursive: true });

  console.log(`\n[extract-frames] Processing: ${input}`);
  console.log(`                 Output dir: ${outDir}`);

  // ffmpeg flags:
  //   -r          output frame rate
  //   -vf scale   resize to reasonable canvas size (1280px wide, keep AR)
  //   -q:v        WebP quality (ffmpeg uses 0=best, 31=worst for vframes;
  //               for libwebp the scale is inverted: 100=best, 0=worst)
  const ffmpegArgs = [
    "-y",
    "-i", input,
    "-vf", `fps=${FPS},scale=1280:-1:flags=lanczos`,
    "-c:v", "libwebp",
    "-quality", String(QUALITY),
    "-lossless", "0",
    join(outDir, "frame-%03d.webp"),
  ];

  try {
    execSync(["ffmpeg", ...ffmpegArgs].join(" "), { stdio: "inherit" });
  } catch {
    console.error(`[extract-frames] ffmpeg failed for ${folder}.`);
    process.exit(1);
  }

  // Count output frames
  const frameFiles = readdirSync(outDir).filter(
    (f) => f.startsWith("frame-") && f.endsWith(".webp")
  );
  const count = frameFiles.length;

  console.log(`\n[extract-frames] ✓ ${folder}: ${count} frames extracted at ${FPS}fps`);
  console.log(
    `                 → Update CHARACTERS[...].frameCount to ${count} in ScrollSection.tsx`
  );
}

console.log("\n[extract-frames] Done.\n");
