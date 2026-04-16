import { prisma } from "@/lib/db/prisma";

export type AuditDetailPayload = {
  id: string;
  createdAt: string;
  category: string;
  action: string;
  resource: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  username: string | null;
  userEmail: string | null;
  payload: Record<string, unknown> | null;
};

export async function getAuditLogDetailForAdmin(
  id: string,
): Promise<AuditDetailPayload | null> {
  const row = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    category: row.category,
    action: row.action,
    resource: row.resource,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    userId: row.userId,
    username: row.user?.username ?? null,
    userEmail: row.user?.email ?? null,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
  };
}
