import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { listPendingRegistrationRequests } from "@/lib/admin/registration-service";

export async function GET(req: NextRequest) {
  const gate = await requireRole(req, ["ADMIN"]);
  if ("error" in gate) return gate.error;

  const items = await listPendingRegistrationRequests();
  return NextResponse.json({ items });
}
