import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { getAuditLogDetailForAdmin } from "@/lib/admin/audit-detail-service";
import { runApi } from "@/lib/api/run-api";
import { prismaCuidParamSchema } from "@/lib/validation/api-bodies";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  return runApi(req, "GET", "/api/admin/audit/[id]", async () => {
    const gate = await requireRole(req, ["ADMIN"]);
    if ("error" in gate) return gate.error;

    const { id } = await context.params;
    const idOk = prismaCuidParamSchema.safeParse(id);
    if (!idOk.success) {
      return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
    }

    const detail = await getAuditLogDetailForAdmin(id);
    if (!detail) {
      return NextResponse.json(
        { error: "Eintrag nicht gefunden." },
        { status: 404 },
      );
    }

    return NextResponse.json({ detail });
  });
}
