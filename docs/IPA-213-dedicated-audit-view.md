# IPA-213: Dedicated Audit View (Detail)

## Ziel

Als **Admin** eine **dedizierte Detailansicht** pro Audit-Eintrag mit **vollständigen Feldern**: Zeitstempel, **userId**, Benutzername/E-Mail, Kategorie, Aktion, Resource, IP, User-Agent, **Jira-Referenz** (bei Rule-Changes), **Diff** (scrollbar bei langen Texten) und **Payload** als formatiertes JSON (Diff im Payload wird zur Lesbarkeit separat oben angezeigt und aus dem JSON-Block ausgeschlossen).

## Navigation

| Von | Zu |
|-----|-----|
| **Übersicht** (`/admin`) | Spalte **Detail** → `/admin/audit/[id]` |
| **Protokoll** (`/admin/audit`, Nav „Protokoll“) | Button **Detail** je Zeile |
| Detailseite | Links **Übersicht**, **Protokoll** |

## API

| Methode | Pfad | Rolle |
|---------|------|--------|
| `GET` | `/api/admin/audit/[id]` | ADMIN |
| `GET` | `/api/admin/audit/list?page=&pageSize=` | ADMIN (Liste für Protokoll-Seite) |

## Technik

- Service: `src/lib/admin/audit-detail-service.ts` — `getAuditLogDetailForAdmin`
- Hilfen: `src/lib/admin/audit-detail-format.ts` — `extractDiffFromPayload`, `extractJiraRefFromPayload`
- UI: `src/app/admin/audit/[id]/page.tsx` — `ScrollArea` für Diff und JSON

## Tests

- `tests/unit/audit-detail-format.test.ts` — Extraktion von Diff/Jira-Ref

## Screenshot

Admin → Eintrag öffnen → Detail mit Diff/JSON für den Bericht ablegen.
