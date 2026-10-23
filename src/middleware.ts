import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { isAuthPath, safeNextPath } from "@/lib/auth-redirect";

const SESSION_COOKIE = "him_session";

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function clearSessionRedirect(loginUrl: URL) {
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authed = await hasValidSession(request);

  if (isAuthPath(pathname)) {
    if (authed) {
      const dest = safeNextPath(request.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // /account — require auth
  if (authed) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    return clearSessionRedirect(login);
  }
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/account", "/login", "/signup"],
};
