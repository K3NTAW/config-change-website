/**
 * IPA-209: Audit Core Service (append-only).
 *
 * Centralises all audit writes. Only `writeAudit` is exported — no update or
 * delete path exists in this module, enforcing immutability at the application
 * layer. Every caller must pass either the global prisma client or a
 * transaction client so the write can be made atomic with its parent operation.
 */

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

/**
 * Minimal interface satisfied by both the global PrismaClient and a
 * Prisma.TransactionClient — and by lightweight mock objects in tests.
 */
export interface AuditClient {
  auditLog: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
}

/**
 * Writes one immutable audit record.
 *
 * Pass a Prisma transaction client (`tx`) when the write must be atomic with
 * another DB operation. Pass the global `prisma` client for standalone writes.
 */
export async function writeAudit(
  client: AuditClient,
  data: WriteAuditInput,
): Promise<void> {
  await client.auditLog.create({ data: data as Record<string, unknown> });
}
