import { describe, it, expect } from "vitest";
import { formatAuditDetailsSummary } from "@/lib/admin/audit-dashboard-format";

describe("formatAuditDetailsSummary (IPA-212)", () => {
  it("positiv: NRT_RULE_CHANGE mit Jira und Datei", () => {
    const s = formatAuditDetailsSummary(
      "NRT_RULE_CHANGE",
      "RULE_PUSHED",
      "rules.xml",
      {
        jiraRef: "NRT-42",
        release: "R1.0",
        environment: "development",
      },
    );
    expect(s).toContain("Jira: NRT-42");
    expect(s).toContain("rules.xml");
    expect(s).toContain("R1.0");
    expect(s).toContain("development");
  });

  it("positiv: RBAC mit Rolle und Benutzer", () => {
    const s = formatAuditDetailsSummary("RBAC", "ROLE_ASSIGNED", "uid-1", {
      newRole: "BASIC",
      targetUsername: "TAA0009",
    });
    expect(s).toContain("TAA0009");
    expect(s).toContain("BASIC");
  });

  it("positiv: ACCOUNT Deaktivierung", () => {
    const s = formatAuditDetailsSummary("ACCOUNT", "USER_DEACTIVATED", "uid-2", {
      targetUsername: "TAA0001",
    });
    expect(s).toContain("TAA0001");
  });

  it("negativ: leerer Payload fällt auf action oder resource zurück", () => {
    expect(
      formatAuditDetailsSummary("SYSTEM", "HEALTH_CHECK", null, null),
    ).toBe("HEALTH_CHECK");
    expect(
      formatAuditDetailsSummary("AUTH", "LOGIN_FAILED", "x", {}),
    ).toBe("LOGIN_FAILED");
  });
});
