# PoC Dokumentation - Auth, RBAC, Audit

## Zweck

Dieser Proof of Concept (PoC) prueft vor der eigentlichen IPA-Implementierung, ob die Kernmechanik fuer Authentifizierung, Rollenpruefung und Audit-Logging im NRT-Kontext technisch sinnvoll und nachvollziehbar umsetzbar ist.

Der PoC ist bewusst **nicht produktionsreif**. Er dient als Machbarkeitsnachweis und Entscheidungsgrundlage.

## PoC-Umfang (In Scope)

1. Login mit TAA-User (Basic Auth Stil) und Rollenrueckgabe.
2. Rollenpruefung auf einem Admin-Endpunkt (ADMIN erlaubt, BASIC gesperrt).
3. Audit-Event-Erfassung fuer:
   - LOGIN_SUCCESS
   - ACCESS_DENIED
   - RULE_CHANGE
4. Validierung einer Jira-Referenz bei Regel-Aenderung (`IPA-XXX`).
5. Anzeige von Audit-Eintraegen (inkl. einfacher Filterung nach User).

## Out of Scope

- Keine persistente Datenbank (in-memory store fuer PoC).
- Kein produktiver Session- oder Security-Hardening-Ansatz.
- Kein vollstaendiger UI-/UX-Ausbau.
- Keine End-to-End Automatisierungstests fuer alle Randfaelle.

## Erfolgskriterien

1. Ein gueltiger Login liefert Session-Token + Rolle.
2. Ein BASIC-User erhaelt auf Admin-Endpunkt einen `403`.
3. Ein ADMIN-User erhaelt auf Admin-Endpunkt einen `200`.
4. Regel-Aenderung ohne gueltige Jira-Referenz wird mit `400` abgewiesen.
5. Erfolgreiche Aktionen erscheinen nachvollziehbar im Audit-Log.

## Technische Umsetzung (PoC)

- PoC-Seite: `/poc`
- API-Endpunkte:
  - `POST /api/poc/login`
  - `GET /api/poc/admin/ping`
  - `POST /api/poc/rules/change`
  - `GET /api/poc/audit`
- In-memory Store:
  - `src/lib/poc-store.ts`

### Test-User fuer Demo

- ADMIN: `TAA1001` / `Admin!1234`
- BASIC: `TAA2001` / `Basic!1234`

## Demo-Ablauf fuer Stakeholder-Meeting (15-20 min)

1. Login als BASIC (`TAA2001`).
2. Admin-Endpunkt pruefen -> erwarteter Status `403`.
3. Gueltige Regel-Aenderung mit Jira-Ref senden (`IPA-201`) -> `200`.
4. Audit laden -> LOGIN_SUCCESS, ACCESS_DENIED und RULE_CHANGE sichtbar.
5. Login als ADMIN (`TAA1001`).
6. Admin-Endpunkt pruefen -> erwarteter Status `200`.
7. Invalid Jira testen (z. B. `NRT-1`) -> erwarteter Status `400`.

## Erwartete Rueckschluesse (A14)

- Der Umfang der Machbarkeitsstudie ist klar abgegrenzt.
- Erfolgskriterien sind messbar ueber HTTP-Status und Audit-Nachweise.
- Die Ergebnisse liefern brauchbare Aussagen zur Umsetzbarkeit.
- Die PoC-Resultate dienen als Entscheidungsgrundlage fuer die IPA-Implementierung.

## Naechste Schritte nach Abnahme

1. In-memory durch persistente Speicherung ersetzen (DB + Constraints).
2. Session/Token-Handling produktionsnah absichern.
3. API-Validierung und Fehlerbehandlung in Story-Umfang ueberfuehren.
4. Audit-UI in bestehendes Admin-Frontend integrieren.
