import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/password-reset-service";
import { logException } from "@/lib/logger";
import { runApi } from "@/lib/api/run-api";
import { parseJsonWithSchema } from "@/lib/api/parse-request-body";
import { forgotPasswordBodySchema } from "@/lib/validation/api-bodies";

export async function POST(req: NextRequest) {
  return runApi(req, "POST", "/api/auth/forgot-password", async () => {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiger JSON-Body." },
        { status: 400 },
      );
    }

    const parsed = parseJsonWithSchema(raw, forgotPasswordBodySchema);
    if (!parsed.ok) return parsed.response;

    try {
      await requestPasswordReset(parsed.data.username);
    } catch (err) {
      logException(err, {
        route: "/api/auth/forgot-password",
        method: "POST",
        phase: "requestPasswordReset",
      });
    }

    return NextResponse.json({
      message:
        "Falls ein Konto mit dieser Kennung existiert, wurde eine Reset-E-Mail versendet.",
    });
  });
}
