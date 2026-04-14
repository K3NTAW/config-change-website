import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth/password-reset-service";

const ERROR_MESSAGES: Record<string, { message: string; status: number }> = {
  INVALID:       { message: "Ungültiger Reset-Token.",              status: 401 },
  EXPIRED:       { message: "Reset-Token ist abgelaufen.",          status: 410 },
  USED:          { message: "Reset-Token wurde bereits verwendet.", status: 410 },
  WEAK_PASSWORD: { message: "Passwort erfüllt die Anforderungen nicht (min. 8 Zeichen, Gross-/Kleinbuchstabe, Sonderzeichen).", status: 422 },
};

export async function POST(req: NextRequest) {
  let body: { token?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  const { token, newPassword } = body;
  if (!token || !newPassword) {
    return NextResponse.json({ error: "Token und neues Passwort erforderlich." }, { status: 400 });
  }

  const result = await resetPassword(token, newPassword);

  if ("error" in result) {
    const { message, status } = ERROR_MESSAGES[result.error];
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ message: "Passwort erfolgreich zurückgesetzt." });
}
