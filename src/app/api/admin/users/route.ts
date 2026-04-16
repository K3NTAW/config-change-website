import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { listUsers } from "@/lib/admin/user-management-service";
import { runApi } from "@/lib/api/run-api";

export async function GET(req: NextRequest) {
  return runApi(req, "GET", "/api/admin/users", async () => {
    const gate = await requireRole(req, ["ADMIN"]);
    if ("error" in gate) return gate.error;

    const users = await listUsers();
    return NextResponse.json({ users });
  });
}
