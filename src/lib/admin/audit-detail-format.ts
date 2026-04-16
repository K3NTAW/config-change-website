/** Extrahiert den Diff-Text aus einem Rule-Change-Payload (falls vorhanden). */
export function extractDiffFromPayload(
  payload: Record<string, unknown> | null,
): string | null {
  if (!payload || typeof payload.diff !== "string") return null;
  return payload.diff;
}

/** Jira-Referenz aus Payload (NRT_RULE_CHANGE). */
export function extractJiraRefFromPayload(
  payload: Record<string, unknown> | null,
): string | null {
  if (!payload || typeof payload.jiraRef !== "string") return null;
  return payload.jiraRef;
}
