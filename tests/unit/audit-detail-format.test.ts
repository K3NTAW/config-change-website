import { describe, it, expect } from "vitest";
import {
  extractDiffFromPayload,
  extractJiraRefFromPayload,
} from "@/lib/admin/audit-detail-format";

describe("audit-detail-format (IPA-213)", () => {
  it("positiv: extrahiert diff-String", () => {
    expect(
      extractDiffFromPayload({ diff: "--- a\n+++ b\n", jiraRef: "NRT-1" }),
    ).toBe("--- a\n+++ b\n");
  });

  it("negativ: kein diff → null", () => {
    expect(extractDiffFromPayload({ jiraRef: "NRT-1" })).toBeNull();
    expect(extractDiffFromPayload(null)).toBeNull();
  });

  it("positiv: Jira-Ref", () => {
    expect(extractJiraRefFromPayload({ jiraRef: "NRT-99" })).toBe("NRT-99");
  });
});
