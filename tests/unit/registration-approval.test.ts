import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationStatus } from "@prisma/client";
import {
  approveRegistration,
  rejectRegistration,
} from "@/lib/admin/registration-service";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/mail/send-temp-password-email", () => ({
  sendTempPasswordEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/prisma", () => {
  const tx = {
    user: { create: vi.fn() },
    registrationRequest: { update: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return {
    prisma: {
      registrationRequest: { findUnique: vi.fn() },
      user: { findFirst: vi.fn() },
      role: { findUnique: vi.fn() },
      $transaction: vi.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    },
  };
});

const p = prisma as unknown as {
  registrationRequest: { findUnique: ReturnType<typeof vi.fn> };
  user: { findFirst: ReturnType<typeof vi.fn> };
  role: { findUnique: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

describe("registration approval (IPA-203)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("genehmigt: legt BASIC-User an und setzt Antrag auf genehmigt", async () => {
    p.registrationRequest.findUnique.mockResolvedValue({
      id: "r1",
      username: "TAA8888",
      email: "x@swisscom.com",
      passwordHash: "old",
      status: RegistrationStatus.PENDING_APPROVAL,
      rejectionReason: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    p.user.findFirst.mockResolvedValue(null);
    p.role.findUnique.mockResolvedValue({
      id: "role-basic",
      name: "BASIC",
      description: null,
    });

    const out = await approveRegistration("r1", "admin-id");
    expect(out).toEqual({ ok: true });
    expect(p.$transaction).toHaveBeenCalled();
  });

  it("lehnt ab: setzt Status und speichert optional Grund", async () => {
    p.registrationRequest.findUnique.mockResolvedValue({
      id: "r2",
      username: "TAA7777",
      email: "y@swisscom.com",
      passwordHash: "h",
      status: RegistrationStatus.PENDING_APPROVAL,
      rejectionReason: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const out = await rejectRegistration("r2", "admin-id", "Team nicht zugeordnet");
    expect(out).toEqual({ ok: true });
  });
});
