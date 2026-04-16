import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/constants";
import { runApi } from "@/lib/api/run-api";

export async function GET(req: NextRequest) {
  return runApi(req, "GET", "/api/auth/session", async () => {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false as const });
    }
    try {
      const session = await verifySessionToken(token);
      return NextResponse.json({
        authenticated: true as const,
        username: session.username,
        role: session.role,
      });
    } catch {
      return NextResponse.json({ authenticated: false as const });
    }
  });
}
