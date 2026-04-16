import { AuditCategory } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type RuleChangeAuditRow = {
  id: string;
  createdAt: string;
  action: string;
  resource: string | null;
  username: string | null;
  payload: Record<string, unknown> | null;
  ipAddress: string | null;
};

export async function listRuleChangeAuditLogs(params: {
  take: number;
  skip: number;
}): Promise<{ items: RuleChangeAuditRow[]; total: number }> {
  const where = { category: AuditCategory.NRT_RULE_CHANGE };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.take,
      skip: params.skip,
      include: { user: { select: { username: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      action: row.action,
      resource: row.resource,
      username: row.user?.username ?? null,
      payload: (row.payload as Record<string, unknown> | null) ?? null,
      ipAddress: row.ipAddress,
    })),
    total,
  };
}
