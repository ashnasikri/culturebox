import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

function makeToken(password: string): string {
  const secret = process.env.VAULT_COOKIE_SECRET ?? "vault-secret";
  return createHmac("sha256", secret).update(password).digest("hex");
}

function isValidToken(token: string): boolean {
  const password = process.env.VAULT_PASSWORD;
  if (!password) return false;
  const expected = makeToken(password);
  return token === expected;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: login page, auth API, Next.js internals, static assets
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("vault-auth")?.value;

  if (!token || !isValidToken(token)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
