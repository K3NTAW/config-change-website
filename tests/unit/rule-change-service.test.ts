import { describe, it, expect, vi, beforeEach } from "vitest";
import { logRuleChange, normalizeJiraRef } from "@/lib/nrt/rule-change-service";

const makeClient = () => ({
  auditLog: { create: vi.fn().mockResolvedValue(undefined) },
});

beforeEach(() => vi.clearAllMocks());

describe("logRuleChange (IPA-211)", () => {
  it("positiv: schreibt NRT_RULE_CHANGE Audit-Record mit allen Pflichtfeldern", async () => {
    const client = makeClient();

    await logRuleChange(client, {
      jiraRef: "NRT-123",
      diff: "-old line\n+new line",
      diffStat: "1 file changed, 2 insertions(+)",
      fileName: "nrt-ruleset.xml",
      release: "2026-Q2",
      environment: "production",
      commitSha: "abc1234",
      userId: "u-admin",
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
    });

    expect(client.auditLog.create).toHaveBeenCalledOnce();
    const args = client.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(args.data.category).toBe("NRT_RULE_CHANGE");
    expect(args.data.action).toBe("RULE_PUSHED");
    expect(args.data.resource).toBe("nrt-ruleset.xml");
    expect(args.data.userId).toBe("u-admin");
    expect(args.data.ipAddress).toBe("10.0.0.1");
    expect(args.data.userAgent).toBe("vitest");

    const payload = args.data.payload as Record<string, unknown>;
    expect(payload.jiraRef).toBe("NRT-123");
    expect(payload.diff).toBe("-old line\n+new line");
    expect(payload.diffStat).toBe("1 file changed, 2 insertions(+)");
    expect(payload.release).toBe("2026-Q2");
    expect(payload.environment).toBe("production");
    expect(payload.commitSha).toBe("abc1234");
  });

  it("positiv: optionaler Kommentar wird im payload gespeichert", async () => {
    const client = makeClient();

    await logRuleChange(client, {
      jiraRef: "NRT-456",
      comment: "Hotfix für Routing-Regel",
      diff: "+neue Regel",
      fileName: "nrt-ruleset.xml",
      release: "2026-Q2",
      environment: "development",
    });

    const args = client.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    const payload = args.data.payload as Record<string, unknown>;
    expect(payload.comment).toBe("Hotfix für Routing-Regel");
  });

  it("positiv: fehlende optionale Felder werden als null gesetzt", async () => {
    const client = makeClient();

    await logRuleChange(client, {
      jiraRef: "NRT-789",
      diff: "+neue Regel",
      fileName: "nrt-ruleset.xml",
      release: "2026-Q2",
      environment: "development",
    });

    const args = client.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    const payload = args.data.payload as Record<string, unknown>;
    expect(payload.comment).toBeNull();
    expect(payload.commitSha).toBeNull();
    expect(payload.diffStat).toBeNull();
    expect(args.data.userId).toBeUndefined();
  });

  it("negativ: Fehler des Audit-Clients wird weitergeleitet", async () => {
    const client = {
      auditLog: {
        create: vi.fn().mockRejectedValue(new Error("DB write failed")),
      },
    };

    await expect(
      logRuleChange(client, {
        jiraRef: "NRT-000",
        diff: "",
        fileName: "nrt-ruleset.xml",
        release: "2026-Q2",
        environment: "production",
      }),
    ).rejects.toThrow("DB write failed");
  });

  it("negativ: diff und jiraRef sind im payload sichtbar (Lesbarkeit)", async () => {
    const client = makeClient();
    const diff = "-remove old\n+add new\n context line";

    await logRuleChange(client, {
      jiraRef: "NRT-101",
      diff,
      fileName: "nrt-ruleset.xml",
      release: "2026-Q1",
      environment: "production",
    });

    const args = client.auditLog.create.mock.calls[0][0] as { data: Record<string, unknown> };
    const payload = args.data.payload as Record<string, unknown>;
    expect(typeof payload.diff).toBe("string");
    expect(payload.diff).toContain("-remove old");
    expect(payload.diff).toContain("+add new");
  });
});

describe("normalizeJiraRef", () => {
  it("setzt NRT-AUTO wenn leer", () => {
    expect(normalizeJiraRef(undefined)).toBe("NRT-AUTO");
    expect(normalizeJiraRef("   ")).toBe("NRT-AUTO");
  });

  it("prefix NRT- bei reiner Nummer", () => {
    expect(normalizeJiraRef("123")).toBe("NRT-123");
  });

  it("behält einen bereits vorhandenen NRT-Key", () => {
    expect(normalizeJiraRef("NRT-456")).toBe("NRT-456");
    expect(normalizeJiraRef("nrt-789")).toBe("NRT-789");
  });
});
