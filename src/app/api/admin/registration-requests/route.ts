import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { listPendingRegistrationRequests } from "@/lib/admin/registration-service";
import { runApi } from "@/lib/api/run-api";

export async function GET(req: NextRequest) {
  return runApi(req, "GET", "/api/admin/registration-requests", async () => {
    const gate = await requireRole(req, ["ADMIN"]);
    if ("error" in gate) return gate.error;

    const items = await listPendingRegistrationRequests();
    return NextResponse.json({ items });
  });
}
