/**
 * IPA-211: Rule Change Tracking (JiraRef, Comment, Diff).
 *
 * Every successful NRT rule push writes one immutable audit record via the
 * Audit Core Service (IPA-209). The record captures who pushed, which Jira
 * ticket was referenced, what the diff looks like and which file was changed.
 */

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

/**
 * Writes a NRT_RULE_CHANGE audit record for a successfully pushed rule file.
 * Call this inside the same transaction as the push, or standalone for
 * out-of-transaction pushes (e.g., GitHub API pushes).
 */
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
