import { describe, it, expect } from "vitest";
import { loginBodySchema, forgotPasswordBodySchema } from "@/lib/validation/api-bodies";
import { buildAuditListWhere as buildWhere } from "@/lib/admin/audit-list-filters";

describe("API body validation (IPA-216)", () => {
  it("Login: SQLi-artige Nutzerkennung wird abgelehnt", () => {
    const r = loginBodySchema.safeParse({
      username: "TAA0001' OR 1=1--",
      password: "any",
    });
    expect(r.success).toBe(false);
  });

  it("Login: gültiges TAA + Passwort", () => {
    const r = loginBodySchema.safeParse({
      username: "TAA0001",
      password: "ValidPassword123!",
    });
    expect(r.success).toBe(true);
  });

  it("Forgot-password: nur TAA oder @swisscom.com", () => {
    expect(
      forgotPasswordBodySchema.safeParse({ username: "TAA1234" }).success,
    ).toBe(true);
    expect(
      forgotPasswordBodySchema.safeParse({
        username: "a@swisscom.com",
      }).success,
    ).toBe(true);
    expect(
      forgotPasswordBodySchema.safeParse({
        username: "evil@example.com",
      }).success,
    ).toBe(false);
  });
});

describe("Audit filter where (Prisma / kein String-SQL)", () => {
  it("bösartiger Username wird gebunden, nicht konkateniert", () => {
    const w = buildWhere({
      username: "'; DROP TABLE audit_logs;--",
      dateFrom: "2026-01-01",
    });
    expect(w).toEqual({
      AND: [
        {
          user: {
            username: "'; DROP TABLE audit_logs;--",
          },
        },
        { createdAt: { gte: expect.any(Date) } },
      ],
    });
  });
});
