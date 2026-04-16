import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { listRecentAuditEntriesForAdmin } from "@/lib/admin/audit-dashboard-service";
import { runApi } from "@/lib/api/run-api";

const DEFAULT_LIMIT = 20;

export async function GET(req: NextRequest) {
  return runApi(req, "GET", "/api/admin/audit/summary", async () => {
    const gate = await requireRole(req, ["ADMIN"]);
    if ("error" in gate) return gate.error;

    const { searchParams } = new URL(req.url);
    const raw = Number(searchParams.get("limit"));
    const limit = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LIMIT;

    const items = await listRecentAuditEntriesForAdmin({ take: limit });
    return NextResponse.json({ items, limit });
  });
}
