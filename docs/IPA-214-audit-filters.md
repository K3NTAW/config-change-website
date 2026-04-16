# IPA-214: Audit-Filter (Benutzer + Zeitraum)

## UI

- Seite: `/admin/audit`
- Felder: **Benutzer** (TAAxxxx, entspricht `users.username`), **Von** / **Bis** (Kalenderdatum, `input type="date"`).
- **Anwenden** übernimmt die Filter und setzt die Seite auf 1; **Zurücksetzen** leert alle Filter.
- Pagination bleibt bei gesetzten Filtern erhalten (Weiter/Zurück).

## API

`GET /api/admin/audit/list` (nur ADMIN)

| Query | Bedeutung |
|-------|-----------|
| `page`, `pageSize` | wie bisher (5–100, Default 25) |
| `username` | exakter Benutzername (TAA-Kennung) |
| `dateFrom`, `dateTo` | `YYYY-MM-DD`, Filter auf `audit_logs.createdAt` (UTC: Tagesbeginn / Tagesende) |

Kombinationen: nur Benutzer, nur Zeitraum, beides — per `AND` verknüpft.

Fehlerantwort **400** bei ungültigem Datumsformat oder wenn `dateFrom` nach `dateTo` liegt.

Antwort enthält zusätzlich `filters: { username?, dateFrom?, dateTo? }` (gesetzte Werte).

## Code

- `src/lib/admin/audit-list-filters.ts` — Parsing und Prisma-`where`
- `src/app/api/admin/audit/list/route.ts`
- `tests/unit/audit-list-filters.test.ts`

## Screenshot

Für den IPA-Bericht: Ansicht `/admin/audit` mit gesetztem Filter und sichtbarer Tabelle oder leerer Liste.
