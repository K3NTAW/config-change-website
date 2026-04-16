import { writeAudit, type AuditClient } from "@/lib/audit/audit-service";

export type RuleChangeInput = {
  jiraRef: string;
  comment?: string | null;
  diff: string;
  /** Kurzstatistik (z. B. Zeilen +/-), für Tabellenansicht */
  diffStat?: string | null;
  fileName: string;
  release: string;
  environment: string;
  commitSha?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Story-Nummer / Jira-Key normalisieren (z. B. "123", "NRT-123", "nrt-456"). */
export function normalizeJiraRef(storyNumber: string | undefined): string {
  const s = storyNumber?.trim();
  if (!s) return "NRT-AUTO";
  const m = s.match(/^NRT[-\s]+(.+)$/i);
  if (m?.[1]) return `NRT-${m[1].trim()}`;
  return `NRT-${s}`;
}

export async function logRuleChange(
  client: AuditClient,
  input: RuleChangeInput,
): Promise<void> {
  await writeAudit(client, {
    category: "NRT_RULE_CHANGE",
    action: "RULE_PUSHED",
    resource: input.fileName,
    userId: input.userId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent ?? null,
    payload: {
      jiraRef: input.jiraRef,
      comment: input.comment ?? null,
      diff: input.diff,
      diffStat: input.diffStat ?? null,
      release: input.release,
      environment: input.environment,
      commitSha: input.commitSha ?? null,
    },
  });
}
