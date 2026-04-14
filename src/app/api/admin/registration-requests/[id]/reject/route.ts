import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { rejectRegistration } from "@/lib/admin/registration-service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const gate = await requireRole(req, ["ADMIN"]);
  if ("error" in gate) return gate.error;

  let reason: string | undefined;
  try {
    const body = await req.json();
    reason = typeof body?.reason === "string" ? body.reason : undefined;
  } catch {
    reason = undefined;
  }

  const { id } = await ctx.params;
  const result = await rejectRegistration(id, gate.session.sub, reason);

  if (result.error === "NOT_FOUND") {
    return NextResponse.json({ error: "Antrag nicht gefunden oder nicht mehr ausstehend." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
