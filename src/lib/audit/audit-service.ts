import { AuditCategory } from "@prisma/client";

export type WriteAuditInput = {
  category: AuditCategory;
  action: string;
  userId?: string | null;
  resource?: string | null;
  payload?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export interface AuditClient {
  auditLog: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
}

export async function writeAudit(
  client: AuditClient,
  data: WriteAuditInput,
): Promise<void> {
  await client.auditLog.create({ data: data as Record<string, unknown> });
}
