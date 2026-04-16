import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth/password-reset-service";
import { runApi } from "@/lib/api/run-api";
import { parseJsonWithSchema } from "@/lib/api/parse-request-body";
import { resetPasswordBodySchema } from "@/lib/validation/api-bodies";

const ERROR_MESSAGES: Record<string, { message: string; status: number }> = {
  INVALID: {
    message: "Ungültiger Reset-Token.",
    status: 401,
  },
  EXPIRED: {
    message: "Reset-Token ist abgelaufen.",
    status: 410,
  },
  USED: {
    message: "Reset-Token wurde bereits verwendet.",
    status: 410,
  },
  WEAK_PASSWORD: {
    message:
      "Passwort erfüllt die Anforderungen nicht (min. 8 Zeichen, Gross-/Kleinbuchstabe, Sonderzeichen).",
    status: 422,
  },
};

export async function POST(req: NextRequest) {
  return runApi(req, "POST", "/api/auth/reset-password", async () => {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiger JSON-Body." },
        { status: 400 },
      );
    }

    const parsed = parseJsonWithSchema(raw, resetPasswordBodySchema);
    if (!parsed.ok) return parsed.response;

    const { token, newPassword } = parsed.data;

    const result = await resetPassword(token, newPassword);

    if ("error" in result) {
      const { message, status } = ERROR_MESSAGES[result.error];
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ message: "Passwort erfolgreich zurückgesetzt." });
  });
}
