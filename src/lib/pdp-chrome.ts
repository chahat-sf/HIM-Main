/** Outfit PDP scroll-zoom chrome (not product catalog). */

export type Focus = { scale: number; x: number; y: number };

export const FOCUS: Record<string, Focus> = {
  intro: { scale: 1, x: 50, y: 50 },
  details: { scale: 2, x: 50, y: 0 },
  sizeFit: { scale: 2, x: 50, y: 0 },
  shipping: { scale: 1, x: 50, y: 50 },
  related: { scale: 1, x: 50, y: 50 },
  fabric: { scale: 1.9, x: 50, y: 66 },
  howToWear: { scale: 1.3, x: 50, y: 42 },
  care: { scale: 1.75, x: 50, y: 34 },
  provenance: { scale: 1.8, x: 44, y: 44 },
  fit: { scale: 1.45, x: 50, y: 72 },
  studio: { scale: 1, x: 50, y: 50 },
};

/** Translate that centres the focal point, clamped so no image edge shows. */
export function focusTransform({ scale, x, y }: Focus) {
  const limit = ((scale - 1) / (2 * scale)) * 100;
  const clamp = (v: number) => Math.max(-limit, Math.min(limit, v));
  return `scale(${scale}) translate(${clamp(50 - x)}%, ${clamp(50 - y)}%)`;
}

export const DUMMY_BLOCKS = [
  {
    focus: "fabric",
    title: "The Fabric Story",
    body: "Cut from a brushed cotton-blend developed for drape and recovery. The hand-feel softens with wear while the structure holds through the shoulder and sleeve. Each roll is dyed in small batches so tone stays consistent across colourways.",
  },
  {
    focus: "howToWear",
    title: "How To Wear",
    body: "Layer over a ribbed henley for cooler evenings, or wear open as a light outer. Pair with tailored trousers for evening and straight denim for day. Hardware is tonal so the piece reads clean under a coat.",
  },
  {
    focus: "care",
    title: "Care Notes",
    body: "Machine wash cold on a gentle cycle, inside out. Reshape while damp and dry flat. Avoid tumble drying and high heat. Steam lightly to release creases — do not iron directly over the zip tape.",
  },
  {
    focus: "provenance",
    title: "Provenance",
    body: "Patterned in our studio, cut and finished by a long-standing workshop we work with season after season. Trims are sourced for longevity: YKK zip, bonded tape, and bartack reinforcement at stress points.",
  },
  {
    focus: "fit",
    title: "Fit Philosophy",
    body: "Relaxed through the chest with a slightly tapered hem. Designed to sit clean over a tee without swimming. If you prefer a closer silhouette, size down; for layering room, stay true to size.",
  },
  {
    focus: "studio",
    title: "Studio Notes",
    body: "Photographed on location under soft window light. Colour on screen may vary by device. Swatches are the most accurate reference for Heather Grey and Burgundy before you commit.",
  },
];
