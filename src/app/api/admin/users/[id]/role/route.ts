import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { assignRole } from "@/lib/admin/user-management-service";
import { runApi } from "@/lib/api/run-api";
import { parseJsonWithSchema } from "@/lib/api/parse-request-body";
import {
  adminAssignRoleBodySchema,
  prismaCuidParamSchema,
} from "@/lib/validation/api-bodies";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return runApi(req, "PATCH", "/api/admin/users/[id]/role", async () => {
    const gate = await requireRole(req, ["ADMIN"]);
    if ("error" in gate) return gate.error;

    const { id } = await ctx.params;
    const idOk = prismaCuidParamSchema.safeParse(id);
    if (!idOk.success) {
      return NextResponse.json({ error: "Ungültige Benutzer-ID." }, { status: 400 });
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiger JSON-Body." },
        { status: 400 },
      );
    }

    const parsed = parseJsonWithSchema(raw, adminAssignRoleBodySchema);
    if (!parsed.ok) return parsed.response;

    const result = await assignRole(id, parsed.data.role, gate.session.sub);

    if ("error" in result) {
      const statusMap = {
        USER_NOT_FOUND: 404,
        ROLE_NOT_FOUND: 422,
        CANNOT_SELF_EDIT: 403,
      };
      return NextResponse.json(
        { error: result.error },
        { status: statusMap[result.error] },
      );
    }

    return NextResponse.json({ ok: true });
  });
}
