import { NextRequest, NextResponse } from "next/server";

// Web Crypto API — available in Edge runtime
async function makeToken(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  try {
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

    const password = process.env.VAULT_PASSWORD;
    const secret = process.env.VAULT_COOKIE_SECRET;

    // If env vars aren't set, redirect to login (don't crash)
    if (!password || !secret) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const token = request.cookies.get("vault-auth")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const expected = await makeToken(password, secret);
    if (token !== expected) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    // Never crash — worst case send to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
