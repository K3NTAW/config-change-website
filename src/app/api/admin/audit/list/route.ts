import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/request-session";
import { prisma } from "@/lib/db/prisma";
import { formatAuditDetailsSummary } from "@/lib/admin/audit-dashboard-format";
import { parseAuditListFiltersFromSearchParams } from "@/lib/admin/audit-list-filters";
import { runApi } from "@/lib/api/run-api";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  return runApi(req, "GET", "/api/admin/audit/list", async () => {
    const gate = await requireRole(req, ["ADMIN"]);
    if ("error" in gate) return gate.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const rawSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(Math.max(5, rawSize), MAX_PAGE_SIZE);

    const parsed = parseAuditListFiltersFromSearchParams(searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { where } = parsed;

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: { user: { select: { username: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const items = rows.map((row) => {
      const payload = (row.payload as Record<string, unknown> | null) ?? null;
      return {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        category: row.category,
        action: row.action,
        resource: row.resource,
        username: row.user?.username ?? null,
        details: formatAuditDetailsSummary(
          row.category,
          row.action,
          row.resource,
          payload,
        ),
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      filters: parsed.filters,
    });
  });
}
