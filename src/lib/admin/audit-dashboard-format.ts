import type { AuditCategory } from "@prisma/client";

const DETAILS_MAX = 320;

/** Lesbare Kurzbeschreibung für die Spalte «Details» (Dashboard). */
export function formatAuditDetailsSummary(
  category: AuditCategory,
  action: string,
  resource: string | null,
  payload: Record<string, unknown> | null,
): string {
  const p = payload ?? {};
  switch (category) {
    case "NRT_RULE_CHANGE": {
      const jira = typeof p.jiraRef === "string" ? p.jiraRef : "";
      const file = resource ?? (typeof p.fileName === "string" ? p.fileName : "");
      const rel = typeof p.release === "string" ? p.release : "";
      const env = typeof p.environment === "string" ? p.environment : "";
      const bits = [jira && `Jira: ${jira}`, file && `Datei: ${file}`, rel && env && `${rel} / ${env}`].filter(Boolean);
      return bits.join(" · ") || action;
    }
    case "RBAC": {
      const role = typeof p.newRole === "string" ? p.newRole : "";
      const un = typeof p.targetUsername === "string" ? p.targetUsername : "";
      return [un && `Benutzer: ${un}`, role && `Rolle: ${role}`].filter(Boolean).join(" · ") || action;
    }
    case "ACCOUNT": {
      const un = typeof p.targetUsername === "string" ? p.targetUsername : "";
      return un ? `Benutzer: ${un}` : action;
    }
    case "AUTH": {
      if (typeof p.username === "string") return `Benutzer: ${p.username}`;
      if (typeof p.email === "string") return `E-Mail: ${p.email}`;
      return action;
    }
    default:
      break;
  }
  try {
    const flat = JSON.stringify(p);
    if (flat && flat !== "{}") {
      const s = flat.length > DETAILS_MAX ? `${flat.slice(0, DETAILS_MAX)}…` : flat;
      return resource ? `${resource} — ${s}` : s;
    }
  } catch {
    /* ignore */
  }
  return resource ?? action;
}
