import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationStatus } from "@prisma/client";

vi.mock("@/lib/mail/send-temp-password-email", () => ({
  sendTempPasswordEmail: vi.fn().mockResolvedValue(undefined),
}));

const makeTx = () => ({
  user: { create: vi.fn() },
  registrationRequest: { update: vi.fn() },
  auditLog: { create: vi.fn() },
});

let tx = makeTx();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    registrationRequest: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    role: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  },
}));

import { prisma } from "@/lib/db/prisma";
import { createRegistrationRequest } from "@/lib/auth/register-service";
import { approveRegistration, rejectRegistration } from "@/lib/admin/registration-service";

const p = prisma as unknown as {
  user: { findFirst: ReturnType<typeof vi.fn> };
  registrationRequest: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
  role: { findUnique: ReturnType<typeof vi.fn> };
  auditLog: { create: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

const pendingRow = {
  id: "req-1",
  username: "TAA1001",
  email: "taa1001@swisscom.com",
  passwordHash: "h",
  status: RegistrationStatus.PENDING_APPROVAL,
  rejectionReason: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  tx = makeTx();
  vi.clearAllMocks();
  p.$transaction.mockImplementation(
    (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
  );
});

describe("REGISTRATION_REQUESTED event (IPA-210)", () => {
  it("positiv: schreibt Audit-Event wenn Antrag erfolgreich angelegt wird", async () => {
    p.user.findFirst.mockResolvedValue(null);
    p.registrationRequest.findFirst.mockResolvedValue(null);
    p.registrationRequest.create.mockResolvedValue({
      id: "req-1",
      status: RegistrationStatus.PENDING_APPROVAL,
    });

    await createRegistrationRequest({
      username: "TAA1001",
      email: "taa1001@swisscom.com",
      password: "Password1!XYZabc",
    });

    expect(p.auditLog.create).toHaveBeenCalledOnce();
    const args = p.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(args.data.action).toBe("REGISTRATION_REQUESTED");
    expect(args.data.category).toBe("AUTH");
    expect((args.data.payload as Record<string, unknown>).username).toBe("TAA1001");
  });

  it("negativ: kein Audit-Event wenn Benutzer bereits existiert (CONFLICT)", async () => {
    p.user.findFirst.mockResolvedValue({ id: "u-existing" });

    await expect(
      createRegistrationRequest({
        username: "TAA1001",
        email: "taa1001@swisscom.com",
      password: "Password1!XYZabc",
    }),
  ).rejects.toThrow();

    expect(p.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("REGISTRATION_APPROVED event (IPA-210)", () => {
  it("positiv: schreibt Audit-Event mit approvedBy (adminUserId)", async () => {
    p.registrationRequest.findUnique.mockResolvedValue(pendingRow);
    p.user.findFirst.mockResolvedValue(null);
    p.role.findUnique.mockResolvedValue({ id: "r-basic", name: "BASIC", description: null });

    await approveRegistration("req-1", "admin-42");

    expect(tx.auditLog.create).toHaveBeenCalledOnce();
    const args = tx.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(args.data.action).toBe("REGISTRATION_APPROVED");
    expect(args.data.category).toBe("AUTH");
    expect(args.data.userId).toBe("admin-42");
    expect((args.data.payload as Record<string, unknown>).targetUsername).toBe("TAA1001");
  });

  it("negativ: kein Audit-Event wenn Antrag nicht gefunden wird", async () => {
    p.registrationRequest.findUnique.mockResolvedValue(null);

    const result = await approveRegistration("req-missing", "admin-42");
    expect(result).toEqual({ error: "NOT_FOUND" });
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("REGISTRATION_REJECTED event (IPA-210)", () => {
  it("positiv: schreibt Audit-Event mit Begründung im payload", async () => {
    p.registrationRequest.findUnique.mockResolvedValue(pendingRow);

    await rejectRegistration("req-1", "admin-42", "Team nicht zugeordnet");

    expect(tx.auditLog.create).toHaveBeenCalledOnce();
    const args = tx.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(args.data.action).toBe("REGISTRATION_REJECTED");
    expect(args.data.category).toBe("AUTH");
    expect(args.data.userId).toBe("admin-42");
    expect((args.data.payload as Record<string, unknown>).reason).toBe("Team nicht zugeordnet");
  });

  it("positiv: Audit-Event auch ohne Begründung (reason = null)", async () => {
    p.registrationRequest.findUnique.mockResolvedValue(pendingRow);

    await rejectRegistration("req-1", "admin-42");

    expect(tx.auditLog.create).toHaveBeenCalledOnce();
    const args = tx.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect((args.data.payload as Record<string, unknown>).reason).toBeNull();
  });

  it("negativ: kein Audit-Event wenn Antrag nicht gefunden wird", async () => {
    p.registrationRequest.findUnique.mockResolvedValue(null);

    const result = await rejectRegistration("req-missing", "admin-42");
    expect(result).toEqual({ error: "NOT_FOUND" });
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
});
