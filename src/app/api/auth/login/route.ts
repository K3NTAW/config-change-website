import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { signSessionToken } from "@/lib/auth/jwt";
import { logInfo, logWarn } from "@/lib/logger";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/constants";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password;
  if (!username || !password) {
    return NextResponse.json({ error: "Benutzerkennung und Passwort erforderlich." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: true },
  });

  if (!user?.passwordHash) {
    logWarn({ action: "LOGIN_FAILED", username, reason: "unknown_user" });
    return NextResponse.json({ error: "Ungültige Zugangsdaten." }, { status: 401 });
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    logWarn({ action: "LOGIN_FAILED", username, reason: "bad_password" });
    return NextResponse.json({ error: "Ungültige Zugangsdaten." }, { status: 401 });
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

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return res;
}
