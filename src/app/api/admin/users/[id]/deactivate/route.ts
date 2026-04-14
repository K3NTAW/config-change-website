import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { deactivateUser } from "@/lib/admin/user-management-service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const gate = await requireRole(req, ["ADMIN"]);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  const result = await deactivateUser(id, gate.session.sub);

  if ("error" in result) {
    const statusMap = {
      USER_NOT_FOUND: 404,
      ALREADY_INACTIVE: 409,
      CANNOT_SELF_EDIT: 403,
    };
    return NextResponse.json({ error: result.error }, { status: statusMap[result.error] });
  }

  return NextResponse.json({ ok: true });
}
