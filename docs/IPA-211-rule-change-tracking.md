# IPA-211: Rule Change Tracking (JiraRef, Kommentar, Diff)

## Ziel

Administratoren können nachvollziehen, **wer** nach einem erfolgreichen **Git-Push** einer NRT-Ruleset-XML **wann** welche **Datei** in welchem **Release/Umgebung** mit welchem **Jira-Bezug** geändert hat — inklusive **vollständigem Diff** (Alt vs. Neu im Unified-Diff-Format) und optionalem **Kommentar**.

## Datenhaltung

- **Tabelle:** `audit_logs` (Prisma-Modell `AuditLog`), `category = NRT_RULE_CHANGE`, `action = RULE_PUSHED`.
- **Unveränderlichkeit:** Einträge werden nur **append-only** über `writeAudit` / `logRuleChange` erzeugt; es gibt keine Update-API auf Audit-Zeilen.
- **Payload (JSON):** `jiraRef`, `comment`, `diff`, `diffStat`, `release`, `environment`, `commitSha`.
- **Metadaten:** `userId` (aus Session), `ipAddress`, `userAgent`, `resource` (Dateiname).

## Ablauf beim Push

1. Vor dem Commit wird der **aktuelle Datei**inhalt aus dem konfigurierten GitHub-Repo gelesen (oder leer, wenn die Datei neu ist).
2. Nach erfolgreichem `updateRef` werden **Diff** und **Statistik** aus Alt- und Neuinhalt berechnet (`generateGitDiff` / `generateDiffStat` — gleiche Logik wie in der Vorschau).
3. `logRuleChange` schreibt den Audit-Eintrag. Schlägt nur das Audit-Schreiben fehl, bleibt der Push erfolgreich; die API-Antwort enthält einen **Hinweis** im Push-Text.

## UI

- **NRT Ruleset:** Nach der Vorschau, vor „Push Changes“, kann ein **optionaler Kommentar** erfasst werden (wird im Audit gespeichert).
- **Admin:** Menüpunkt **Regeländerungen** (`/admin/rule-changes`) — Tabelle mit Zeit, Benutzer, Jira, Datei, Release/Umgebung; **Diff** öffnet einen Dialog mit Statistik und farbig formatiertem Diff.

## API

- `GET /api/admin/audit/rule-changes?page=&pageSize=` — nur **ADMIN**, paginiert.

## Tests

- Unit-Tests: `tests/unit/rule-change-service.test.ts` (inkl. `normalizeJiraRef`).

## Jira-Referenz

- `normalizeJiraRef` bildet Story-Eingaben wie `123`, `NRT-456` oder `nrt-789` auf ein einheitliches `NRT-…` ab; ohne Eingabe: `NRT-AUTO`.
