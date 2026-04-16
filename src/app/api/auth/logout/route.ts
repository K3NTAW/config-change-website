import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { logInfo } from "@/lib/logger";
import { runApi } from "@/lib/api/run-api";
import { SESSION_COOKIE_NAME } from "@/constants";
import { clearSessionCookieOptions } from "@/lib/auth/session-cookie";

export async function POST(req: NextRequest) {
  return runApi(req, "POST", "/api/auth/logout", async () => {
    const session = await getSessionFromRequest(req);

    if (session) {
      logInfo({ action: "LOGOUT", username: session.username });
    }

    const res = NextResponse.json({ message: "Abgemeldet." });
    res.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookieOptions());

    return res;
  });
}
