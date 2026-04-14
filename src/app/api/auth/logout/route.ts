import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { logInfo } from "@/lib/logger";
import { SESSION_COOKIE_NAME } from "@/constants";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (session) {
    logInfo({ action: "LOGOUT", username: session.username });
  }

  const res = NextResponse.json({ message: "Abgemeldet." });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
