import { writeAudit, type AuditClient } from "@/lib/audit/audit-service";

export type RuleChangeInput = {
  jiraRef: string;
  comment?: string | null;
  diff: string;
  fileName: string;
  release: string;
  environment: string;
  commitSha?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
};

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
    payload: {
      jiraRef: input.jiraRef,
      comment: input.comment ?? null,
      diff: input.diff,
      release: input.release,
      environment: input.environment,
      commitSha: input.commitSha ?? null,
    },
  });
}
