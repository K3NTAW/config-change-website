import { describe, it, expect } from "vitest";
import { redactForLogs } from "@/lib/logger";

describe("log redaction (IPA-216)", () => {
  it("maskiert sensitive Keys", () => {
    const o = redactForLogs({
      action: "TEST",
      password: "secret",
      nested: { newPassword: "x", safe: "ok" },
    }) as Record<string, unknown>;
    expect(o.password).toBe("[REDACTED]");
    expect((o.nested as Record<string, unknown>).newPassword).toBe("[REDACTED]");
    expect((o.nested as Record<string, unknown>).safe).toBe("ok");
  });
});
