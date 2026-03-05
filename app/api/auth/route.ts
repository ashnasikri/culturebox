import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

function makeToken(password: string): string {
  const secret = process.env.VAULT_COOKIE_SECRET ?? "vault-secret";
  return createHmac("sha256", secret).update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expected = process.env.VAULT_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json(
      { success: false, error: "Wrong password" },
      { status: 401 }
    );
  }

  const token = makeToken(password);

  const res = NextResponse.json({ success: true });
  res.cookies.set("vault-auth", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 365 days
  });
  return res;
}
