# IPA-212: Admin Dashboard — Audit Summary

## Ziel

Als **Admin** die **neuesten Audit-Einträge** (ca. 10–20) auf einen Blick sehen: **Zeit**, **Benutzer**, **Kategorie**, **Aktion** und **Details**, um den aktuellen Überblick (inkl. sicherheitsrelevanter Ereignisse) schnell einzuschätzen.

## Umsetzung

| Bestandteil | Beschreibung |
|-------------|----------------|
| **Route** | `/admin` — nutzt das bestehende `admin/layout.tsx` (Header mit Navigation). |
| **API** | `GET /api/admin/audit/summary?limit=20` — nur **ADMIN** (`requireRole`), liefert die letzten Einträge aus `audit_logs` (alle Kategorien), absteigend nach `createdAt`. |
| **Service** | `src/lib/admin/audit-dashboard-service.ts` — `listRecentAuditEntriesForAdmin`, `formatAuditDetailsSummary` für lesbare Detailtexte je Kategorie. |
| **UI** | Tabelle mit Badges für die Kategorie; Details zeilenweise gekürzt (`line-clamp`), vollständiger Text per `title`-Tooltip. |

## Daten

- Quelle: Prisma-Modell `AuditLog` (append-only), inkl. Relation `user.username` wenn `userId` gesetzt ist.
- Limit: Standard **20**, maximal **20** (Server-seitig begrenzt).

## Tests

- Unit-Tests: `tests/unit/audit-dashboard-service.test.ts` — `formatAuditDetailsSummary` (positiv: NRT, RBAC, ACCOUNT; negativ: leerer Payload).

## Manueller Negativtest (API)

- Ohne Admin-Session: `GET /api/admin/audit/summary` → **403** bzw. Redirect über Middleware bei fehlender Anmeldung.

## Screenshot (Bericht)

Nach Deploy: Admin einloggen → **Übersicht** (`/admin`) → Screenshot für die IPA-Dokumentation.
