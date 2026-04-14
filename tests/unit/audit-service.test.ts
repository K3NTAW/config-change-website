/**
 * IPA-209: Audit Core Service tests.
 *
 * Covers:
 *  - writeAudit calls auditLog.create with all required fields
 *  - writeAudit accepts a transaction client (atomic writes)
 *  - Immutability: the audit-service module exports no delete or update path
 *  - No call to auditLog.update or auditLog.delete is ever made
 */

import { describe, it, expect, vi } from "vitest";
import * as auditServiceModule from "@/lib/audit/audit-service";
import { writeAudit } from "@/lib/audit/audit-service";

// --------------------------------------------------------------------------
// Structural immutability test
// --------------------------------------------------------------------------

describe("audit-service module exports (IPA-209 immutability)", () => {
  it("does not export a deleteAudit function", () => {
    expect((auditServiceModule as Record<string, unknown>).deleteAudit).toBeUndefined();
  });

  it("does not export an updateAudit function", () => {
    expect((auditServiceModule as Record<string, unknown>).updateAudit).toBeUndefined();
  });

  it("exports only writeAudit as the single write path", () => {
    const exported = Object.keys(auditServiceModule);
    expect(exported).toEqual(["writeAudit"]);
  });
});

// --------------------------------------------------------------------------
// writeAudit behaviour tests
// --------------------------------------------------------------------------

describe("writeAudit (IPA-209)", () => {
  const makeClient = () => ({
    auditLog: { create: vi.fn().mockResolvedValue(undefined) },
  });

  it("positiv: calls auditLog.create with required fields", async () => {
    const client = makeClient();
    await writeAudit(client, {
      category: "AUTH",
      action: "LOGIN_SUCCESS",
      userId: "u1",
    });

    expect(client.auditLog.create).toHaveBeenCalledOnce();
    const args = client.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(args.data.category).toBe("AUTH");
    expect(args.data.action).toBe("LOGIN_SUCCESS");
    expect(args.data.userId).toBe("u1");
  });

  it("positiv: accepts optional fields (resource, payload, ipAddress, userAgent)", async () => {
    const client = makeClient();
    await writeAudit(client, {
      category: "RBAC",
      action: "ROLE_ASSIGNED",
      userId: "admin1",
      resource: "u2",
      payload: { newRole: "BASIC" },
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });

    const args = client.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(args.data.resource).toBe("u2");
    expect(args.data.payload).toEqual({ newRole: "BASIC" });
    expect(args.data.ipAddress).toBe("127.0.0.1");
  });

  it("positiv: works with a transaction client (atomic pattern)", async () => {
    const txClient = makeClient();
    await writeAudit(txClient, {
      category: "ACCOUNT",
      action: "USER_DEACTIVATED",
      userId: "admin1",
      resource: "u3",
    });

    expect(txClient.auditLog.create).toHaveBeenCalledOnce();
  });

  it("immutability: auditLog.create is called, never update or delete", async () => {
    const client = {
      auditLog: {
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    await writeAudit(client, { category: "SYSTEM", action: "APP_START" });

    expect(client.auditLog.create).toHaveBeenCalledOnce();
    expect(client.auditLog.update).not.toHaveBeenCalled();
    expect(client.auditLog.delete).not.toHaveBeenCalled();
  });

  it("negativ: propagates errors from the underlying client", async () => {
    const client = {
      auditLog: {
        create: vi.fn().mockRejectedValue(new Error("DB constraint violation")),
      },
    };

    await expect(
      writeAudit(client, { category: "AUTH", action: "LOGIN_FAIL" }),
    ).rejects.toThrow("DB constraint violation");
  });
});
