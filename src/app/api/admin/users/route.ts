import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { listUsers } from "@/lib/admin/user-management-service";

export async function GET(req: NextRequest) {
  const gate = await requireRole(req, ["ADMIN"]);
  if ("error" in gate) return gate.error;

  const users = await listUsers();
  return NextResponse.json({ users });
}
