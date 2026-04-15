import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/password-reset-service";
import { logWarn } from "@/lib/logger";

export async function POST(req: NextRequest) {
  let body: { username?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  const username = body.username?.trim();
  if (!username) {
    return NextResponse.json({ error: "Benutzerkennung erforderlich." }, { status: 400 });
  }

  try {
    await requestPasswordReset(username);
  } catch (err) {
    logWarn({ action: "PASSWORD_RESET_REQUEST_ERROR", error: String(err) });
  }

  return NextResponse.json({
    message: "Falls ein Konto mit dieser Kennung existiert, wurde eine Reset-E-Mail versendet.",
  });
}
