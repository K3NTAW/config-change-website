import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { signSessionToken } from "@/lib/auth/jwt";
import { logInfo, logWarn } from "@/lib/logger";
import { runApi } from "@/lib/api/run-api";
import { parseJsonWithSchema } from "@/lib/api/parse-request-body";
import { loginBodySchema } from "@/lib/validation/api-bodies";
import { sessionCookieOptions } from "@/lib/auth/session-cookie";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/constants";

export async function POST(req: NextRequest) {
  return runApi(req, "POST", "/api/auth/login", async () => {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiger JSON-Body." },
        { status: 400 },
      );
    }

    const parsed = parseJsonWithSchema(raw, loginBodySchema);
    if (!parsed.ok) return parsed.response;

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (!user?.passwordHash) {
      logWarn({ action: "LOGIN_FAILED", username, reason: "unknown_user" });
      return NextResponse.json(
        { error: "Ungültige Zugangsdaten." },
        { status: 401 },
      );
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      logWarn({ action: "LOGIN_FAILED", username, reason: "bad_password" });
      return NextResponse.json(
        { error: "Ungültige Zugangsdaten." },
        { status: 401 },
      );
    }

    const token = await signSessionToken({
      sub: user.id,
      username: user.username,
      role: user.role.name,
    });

    logInfo({ action: "LOGIN_SUCCESS", username, role: user.role.name });

    const res = NextResponse.json({
      token,
      role: user.role.name,
      mustChangePassword: user.mustChangePassword,
    });

    res.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      sessionCookieOptions(SESSION_MAX_AGE),
    );

    return res;
  });
}
