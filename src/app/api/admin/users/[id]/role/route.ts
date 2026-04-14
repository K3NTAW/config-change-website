import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { assignRole } from "@/lib/admin/user-management-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireRole(req, ["ADMIN"]);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  if (!body.role) {
    return NextResponse.json({ error: "Rolle erforderlich." }, { status: 400 });
  }

  const result = await assignRole(id, body.role, gate.session.sub);

  if ("error" in result) {
    const statusMap = {
      USER_NOT_FOUND: 404,
      ROLE_NOT_FOUND: 422,
      CANNOT_SELF_EDIT: 403,
    };
    return NextResponse.json({ error: result.error }, { status: statusMap[result.error] });
  }

  return NextResponse.json({ ok: true });
}
