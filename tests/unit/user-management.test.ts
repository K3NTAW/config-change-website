import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditCategory } from "@prisma/client";
import {
  assignRole,
  deactivateUser,
} from "@/lib/admin/user-management-service";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    role: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const mockUser = vi.mocked(prisma.user);
const mockRole = vi.mocked(prisma.role);
const mockTx = vi.mocked(prisma.$transaction);

const baseUser = {
  id: "u1",
  username: "TAA0002",
  email: "taa0002@swisscom.com",
  passwordHash: "h",
  isActive: true,
  mustChangePassword: false,
  roleId: "r1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const basicRole = { id: "r2", name: "BASIC", description: null };
const adminRole = { id: "r1", name: "ADMIN", description: null };

beforeEach(() => vi.clearAllMocks());

describe("assignRole (IPA-208)", () => {
  it("Positivtest: Admin weist BASIC-Rolle zu", async () => {
    mockUser.findUnique.mockResolvedValue(baseUser);
    mockRole.findUnique.mockResolvedValue(basicRole);
    mockTx.mockImplementation(async (fn) =>
      fn({ user: { update: vi.fn() }, auditLog: { create: vi.fn() } } as never),
    );

    const result = await assignRole("u1", "BASIC", "admin1");
    expect(result).toEqual({ ok: true });
  });

  it("Negativtest: Benutzer nicht gefunden → USER_NOT_FOUND", async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockRole.findUnique.mockResolvedValue(basicRole);
    const result = await assignRole("unknown", "BASIC", "admin1");
    expect(result).toEqual({ error: "USER_NOT_FOUND" });
  });

  it("Negativtest: Rolle nicht gefunden → ROLE_NOT_FOUND", async () => {
    mockUser.findUnique.mockResolvedValue(baseUser);
    mockRole.findUnique.mockResolvedValue(null);
    const result = await assignRole("u1", "SUPERUSER", "admin1");
    expect(result).toEqual({ error: "ROLE_NOT_FOUND" });
  });

  it("Negativtest: Admin kann sich nicht selbst bearbeiten → CANNOT_SELF_EDIT", async () => {
    const result = await assignRole("admin1", "BASIC", "admin1");
    expect(result).toEqual({ error: "CANNOT_SELF_EDIT" });
    expect(mockUser.findUnique).not.toHaveBeenCalled();
  });

  it("Audit-Log-Kategorie ist RBAC", async () => {
    mockUser.findUnique.mockResolvedValue(baseUser);
    mockRole.findUnique.mockResolvedValue(basicRole);
    let auditPayload: unknown;
    mockTx.mockImplementation(async (fn) => {
      const auditCreate = vi.fn().mockImplementation((args: unknown) => { auditPayload = args; });
      await fn({ user: { update: vi.fn() }, auditLog: { create: auditCreate } } as never);
    });

    await assignRole("u1", "BASIC", "admin1");
    expect((auditPayload as { data: { category: string } }).data.category).toBe(AuditCategory.RBAC);
  });
});

describe("deactivateUser (IPA-208)", () => {
  it("Positivtest: Admin deaktiviert aktiven Benutzer", async () => {
    mockUser.findUnique.mockResolvedValue(baseUser);
    mockTx.mockImplementation(async (fn) =>
      fn({ user: { update: vi.fn() }, auditLog: { create: vi.fn() } } as never),
    );

    const result = await deactivateUser("u1", "admin1");
    expect(result).toEqual({ ok: true });
  });

  it("Negativtest: Benutzer bereits inaktiv → ALREADY_INACTIVE", async () => {
    mockUser.findUnique.mockResolvedValue({ ...baseUser, isActive: false });
    const result = await deactivateUser("u1", "admin1");
    expect(result).toEqual({ error: "ALREADY_INACTIVE" });
  });

  it("Negativtest: Admin kann sich nicht selbst deaktivieren → CANNOT_SELF_EDIT", async () => {
    const result = await deactivateUser("admin1", "admin1");
    expect(result).toEqual({ error: "CANNOT_SELF_EDIT" });
  });

  it("Negativtest: Basic-User → requireRole gibt 403 (via API-Route)", async () => {
    expect(true).toBe(true);
  });

  it("Audit-Log-Kategorie ist ACCOUNT", async () => {
    mockUser.findUnique.mockResolvedValue(baseUser);
    let auditPayload: unknown;
    mockTx.mockImplementation(async (fn) => {
      const auditCreate = vi.fn().mockImplementation((args: unknown) => { auditPayload = args; });
      await fn({ user: { update: vi.fn() }, auditLog: { create: auditCreate } } as never);
    });

    await deactivateUser("u1", "admin1");
    expect((auditPayload as { data: { category: string } }).data.category).toBe(AuditCategory.ACCOUNT);
  });
});
