import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Same algorithm as middleware: SHA-256(password + secret)
function makeToken(password: string, secret: string): string {
  return createHash("sha256").update(password + secret).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const expected = process.env.VAULT_PASSWORD;
    const secret = process.env.VAULT_COOKIE_SECRET ?? "vault-secret";

    if (!expected || !password || password !== expected) {
      return NextResponse.json(
        { success: false, error: "Wrong password" },
        { status: 401 }
      );
    }

    const token = makeToken(password, secret);

    const res = NextResponse.json({ success: true });
    res.cookies.set("vault-auth", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 365 days
    });
    return res;
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
