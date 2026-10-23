const AUTH_PREFIXES = ["/login", "/signup"];

export function isAuthPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || pathname;
  return AUTH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Validate a post-auth return path. Only same-origin relative paths;
 * never bounce back to auth routes. Default: home.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/";

  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return "/";
  }

  const trimmed = decoded.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (trimmed.includes("://")) return "/";

  const pathname = trimmed.split("?")[0]?.split("#")[0] ?? trimmed;
  if (isAuthPath(pathname)) return "/";

  return trimmed;
}

export function buildLoginHref(pathname: string, search = ""): string {
  if (isAuthPath(pathname)) return "/login";
  const next = `${pathname}${search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

export function withNextQuery(href: string, next: string | null): string {
  const safe = next ? safeNextPath(next) : "/";
  if (safe === "/") return href;
  const url = new URL(href, "http://local.invalid");
  url.searchParams.set("next", safe);
  return `${url.pathname}${url.search}`;
}

/** Same-origin referrer path+search, or null. */
export function pathFromReferrer(referrer: string, origin: string): string | null {
  if (!referrer || !origin) return null;
  try {
    const url = new URL(referrer);
    if (url.origin !== origin) return null;
    if (isAuthPath(url.pathname)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
