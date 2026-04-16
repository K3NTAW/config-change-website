import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { rejectRegistration } from "@/lib/admin/registration-service";
import { runApi } from "@/lib/api/run-api";
import { parseJsonWithSchema } from "@/lib/api/parse-request-body";
import {
  prismaCuidParamSchema,
  rejectRegistrationBodySchema,
} from "@/lib/validation/api-bodies";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  return runApi(req, "POST", "/api/admin/registration-requests/[id]/reject", async () => {
    const gate = await requireRole(req, ["ADMIN"]);
    if ("error" in gate) return gate.error;

    const { id } = await ctx.params;
    const idOk = prismaCuidParamSchema.safeParse(id);
    if (!idOk.success) {
      return NextResponse.json({ error: "Ungültige Antrags-ID." }, { status: 400 });
    }

    let raw: unknown = {};
    try {
      raw = await req.json();
    } catch {
      raw = {};
    }

    const parsed = parseJsonWithSchema(raw, rejectRegistrationBodySchema);
    if (!parsed.ok) return parsed.response;

    const result = await rejectRegistration(
      id,
      gate.session.sub,
      parsed.data.reason ?? undefined,
    );

    if (result.error === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Antrag nicht gefunden oder nicht mehr ausstehend." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  });
}
