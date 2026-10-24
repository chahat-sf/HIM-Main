/**
 * Map a product image path to its listing-card WebP under /products/cards/.
 * Full-resolution paths stay unchanged for PDP galleries.
 */
export function toCardImage(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  if (src.startsWith("/products/cards/")) return src;
  if (!src.startsWith("/products/")) return src;

  const rest = src.slice("/products/".length);
  const slash = rest.lastIndexOf("/");
  const dir = slash >= 0 ? rest.slice(0, slash + 1) : "";
  const file = slash >= 0 ? rest.slice(slash + 1) : rest;
  const base = file.replace(/\.[^.]+$/, "");
  return `/products/cards/${dir}${base}.webp`;
}
