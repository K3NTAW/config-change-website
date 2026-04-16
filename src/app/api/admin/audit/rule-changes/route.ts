import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { listRuleChangeAuditLogs } from "@/lib/admin/rule-change-audit-service";
import { runApi } from "@/lib/api/run-api";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  return runApi(req, "GET", "/api/admin/audit/rule-changes", async () => {
    const gate = await requireRole(req, ["ADMIN"]);
    if ("error" in gate) return gate.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const rawSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(Math.max(1, rawSize), MAX_PAGE_SIZE);

    const { items, total } = await listRuleChangeAuditLogs({
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
    });
  });
}
