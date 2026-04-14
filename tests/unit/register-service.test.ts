import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationStatus } from "@prisma/client";
import { createRegistrationRequest } from "@/lib/auth/register-service";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    registrationRequest: { findFirst: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue(undefined) },
  },
}));

const mockUser = vi.mocked(prisma.user);
const mockReq = vi.mocked(prisma.registrationRequest);

describe("createRegistrationRequest (IPA-202)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("legt einen PENDING-Antrag an, wenn alles frei ist", async () => {
    mockUser.findFirst.mockResolvedValue(null);
    mockReq.findFirst.mockResolvedValue(null);
    mockReq.create.mockResolvedValue({
      id: "req1",
      username: "TAA9999",
      email: "x@swisscom.com",
      passwordHash: "hash",
      status: RegistrationStatus.PENDING_APPROVAL,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const out = await createRegistrationRequest({
      username: "TAA9999",
      email: "X@swisscom.com",
      password: "sicherLang123!",
    });

    expect(out.id).toBe("req1");
    expect(out.status).toBe(RegistrationStatus.PENDING_APPROVAL);
    expect(mockReq.create).toHaveBeenCalledOnce();
    const call = mockReq.create.mock.calls[0][0];
    expect(call.data.username).toBe("TAA9999");
    expect(call.data.email).toBe("x@swisscom.com");
    expect(call.data.passwordHash).toBeDefined();
    expect(call.data.passwordHash).not.toContain("sicherLang");
  });

  it("wirft bei bestehendem User (Konflikt)", async () => {
    mockUser.findFirst.mockResolvedValue({
      id: "u1",
      username: "TAA0001",
      email: "a@swisscom.com",
      passwordHash: "x",
      isActive: true,
      mustChangePassword: false,
      roleId: "r1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      createRegistrationRequest({
        username: "TAA1234",
        email: "a@swisscom.com",
        password: "sicherLang123!",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", httpStatus: 409 });
  });

  it("wirft bei ausstehendem Antrag (Konflikt)", async () => {
    mockUser.findFirst.mockResolvedValue(null);
    mockReq.findFirst.mockResolvedValue({
      id: "p1",
      username: "TAA1234",
      email: "a@swisscom.com",
      passwordHash: "h",
      status: RegistrationStatus.PENDING_APPROVAL,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      createRegistrationRequest({
        username: "TAA1234",
        email: "a@swisscom.com",
        password: "sicherLang123!",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", httpStatus: 409 });
  });
});
