import { prisma } from "@/lib/db/prisma";
import type { AuditCategory } from "@prisma/client";
import { formatAuditDetailsSummary } from "@/lib/admin/audit-dashboard-format";

export type AuditSummaryRow = {
  id: string;
  createdAt: string;
  category: AuditCategory;
  action: string;
  resource: string | null;
  username: string | null;
  details: string;
};

export { formatAuditDetailsSummary } from "@/lib/admin/audit-dashboard-format";

export async function listRecentAuditEntriesForAdmin(params: {
  take: number;
}): Promise<AuditSummaryRow[]> {
  const take = Math.min(Math.max(1, params.take), 20);
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { username: true } } },
  });

  return rows.map((row) => {
    const payload = (row.payload as Record<string, unknown> | null) ?? null;
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      category: row.category,
      action: row.action,
      resource: row.resource,
      username: row.user?.username ?? null,
      details: formatAuditDetailsSummary(row.category, row.action, row.resource, payload),
    };
  });
}
