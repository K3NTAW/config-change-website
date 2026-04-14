import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateRawToken,
  hashToken,
  resetPassword,
  requestPasswordReset,
} from "@/lib/auth/password-reset-service";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn(), update: vi.fn() },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/mail/send-reset-password-email", () => ({
  sendResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockUser = vi.mocked(prisma.user);
const mockToken = vi.mocked(prisma.passwordResetToken);
const mockTx = vi.mocked(prisma.$transaction);

beforeEach(() => vi.clearAllMocks());

describe("generateRawToken / hashToken (IPA-206)", () => {
  it("generiert einen 64-Zeichen Hex-Token", () => {
    const token = generateRawToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("zwei Tokens sind verschieden", () => {
    expect(generateRawToken()).not.toBe(generateRawToken());
  });

  it("hashToken ist deterministisch", () => {
    const raw = "abc123";
    expect(hashToken(raw)).toBe(hashToken(raw));
  });

  it("hashToken unterscheidet sich vom Rohwert", () => {
    const raw = generateRawToken();
    expect(hashToken(raw)).not.toBe(raw);
  });
});

describe("requestPasswordReset (IPA-206)", () => {
  it("tut nichts wenn Benutzer nicht gefunden", async () => {
    mockUser.findFirst.mockResolvedValue(null);
    await expect(requestPasswordReset("unknown")).resolves.toBeUndefined();
    expect(mockToken.create).not.toHaveBeenCalled();
  });
});

describe("resetPassword (IPA-206)", () => {
  it("Positivtest: setzt Passwort erfolgreich", async () => {
    const raw = generateRawToken();
    const tokenHash = hashToken(raw);
    mockToken.findUnique.mockResolvedValue({
      id: "t1",
      tokenHash,
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: new Date(),
    });
    mockTx.mockImplementation(async (fn) => fn({ user: { update: vi.fn() }, passwordResetToken: { update: vi.fn() } } as never));

    const result = await resetPassword(raw, "Sicher1!");
    expect(result).toEqual({ ok: true });
  });

  it("Negativtest: abgelaufener Token → EXPIRED", async () => {
    const raw = generateRawToken();
    mockToken.findUnique.mockResolvedValue({
      id: "t2",
      tokenHash: hashToken(raw),
      userId: "u1",
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
      createdAt: new Date(),
    });

    const result = await resetPassword(raw, "Sicher1!");
    expect(result).toEqual({ error: "EXPIRED" });
  });

  it("Negativtest: bereits verwendeter Token → USED", async () => {
    const raw = generateRawToken();
    mockToken.findUnique.mockResolvedValue({
      id: "t3",
      tokenHash: hashToken(raw),
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await resetPassword(raw, "Sicher1!");
    expect(result).toEqual({ error: "USED" });
  });

  it("Negativtest: ungültiger Token → INVALID", async () => {
    mockToken.findUnique.mockResolvedValue(null);
    const result = await resetPassword("nichtexistent", "Sicher1!");
    expect(result).toEqual({ error: "INVALID" });
  });

  it("Negativtest: schwaches Passwort → WEAK_PASSWORD", async () => {
    const result = await resetPassword(generateRawToken(), "123");
    expect(result).toEqual({ error: "WEAK_PASSWORD" });
  });
});
