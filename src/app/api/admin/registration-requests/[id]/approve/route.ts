import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { approveRegistration } from "@/lib/admin/registration-service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const gate = await requireRole(req, ["ADMIN"]);
  if ("error" in gate) return gate.error;

  const { id } = await ctx.params;
  const result = await approveRegistration(id, gate.session.sub);

  if (result.error === "NOT_FOUND") {
    return NextResponse.json({ error: "Antrag nicht gefunden oder nicht mehr ausstehend." }, { status: 404 });
  }
  if (result.error === "USER_EXISTS") {
    return NextResponse.json({ error: "Benutzer existiert bereits." }, { status: 409 });
  }
  if (result.error === "CONFIG") {
    return NextResponse.json({ error: "Server-Konfiguration unvollständig (Rolle BASIC)." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
