import type { Prisma } from "@prisma/client";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type AuditListFilterInput = {
  username?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ParsedAuditListFilters =
  | {
      ok: true;
      filters: AuditListFilterInput;
      where: Prisma.AuditLogWhereInput;
    }
  | { ok: false; error: string };

/** Trimmed non-empty string, or undefined (no filter). */
export function parseUsernameFilter(value: string | null): string | undefined {
  if (value == null) return undefined;
  const t = value.trim();
  return t.length ? t : undefined;
}

/** Validates `YYYY-MM-DD` calendar date; returns normalized string or undefined if empty. */
export function parseDateOnlyParam(
  value: string | null,
): { ok: true; date?: string } | { ok: false; error: string } {
  if (value == null || value.trim() === "") {
    return { ok: true, date: undefined };
  }
  const t = value.trim();
  if (!DATE_ONLY_RE.test(t)) {
    return { ok: false, error: "Datum muss im Format YYYY-MM-DD sein." };
  }
  const d = new Date(`${t}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Ungültiges Datum." };
  }
  return { ok: true, date: t };
}

function startOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function endOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

/** Builds Prisma `where` for audit log list (user = TAA-Benutzername, Zeitraum auf `createdAt`). */
export function buildAuditListWhere(
  input: AuditListFilterInput,
): Prisma.AuditLogWhereInput {
  const parts: Prisma.AuditLogWhereInput[] = [];
  if (input.username) {
    parts.push({ user: { username: input.username } });
  }
  if (input.dateFrom) {
    parts.push({ createdAt: { gte: startOfUtcDay(input.dateFrom) } });
  }
  if (input.dateTo) {
    parts.push({ createdAt: { lte: endOfUtcDay(input.dateTo) } });
  }
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

export function parseAuditListFiltersFromSearchParams(
  searchParams: URLSearchParams,
): ParsedAuditListFilters {
  const username = parseUsernameFilter(searchParams.get("username"));

  const fromParsed = parseDateOnlyParam(searchParams.get("dateFrom"));
  if (!fromParsed.ok) return fromParsed;
  const toParsed = parseDateOnlyParam(searchParams.get("dateTo"));
  if (!toParsed.ok) return toParsed;

  const dateFrom = fromParsed.date;
  const dateTo = toParsed.date;

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return {
      ok: false,
      error: "Das Startdatum darf nicht nach dem Enddatum liegen.",
    };
  }

  const filters: AuditListFilterInput = { username, dateFrom, dateTo };
  return {
    ok: true,
    filters,
    where: buildAuditListWhere(filters),
  };
}
