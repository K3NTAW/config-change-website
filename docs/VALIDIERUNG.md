# Stakeholder-Validierung (30 Minuten) - Guetestufe 3 Vorlage

## Ziel der Sitzung

In einer kompakten Sitzung werden **PoC-Machbarkeit** und **Stakeholder-Validierung** gemeinsam durchgefuehrt, sodass die Nachweise fuer eine Bewertung auf Guetestufe 3 belastbar dokumentiert sind.

## Teilnehmer

- Stakeholder: Damir Peric
- Durchfuehrung/Moderation: Waibel Kenta

## Voraussetzungen vor dem Call (5 Minuten Vorbereitung)

- PoC laeuft lokal: `http://localhost:3000/poc`
- PoC-Doku liegt bereit: `docs/POC_DOKUMENTATION.md`
- Diese Vorlage ist offen und wird live befuellt.

## 30-Minuten Ablaufplan

### 0:00 - 0:03 Begruessung und Zielbild

- Ziel erklaeren: Machbarkeit pruefen und fachliches Go fuer Umsetzung einholen.
- Scope klar abgrenzen: PoC, keine produktionsreife Loesung.

### 0:03 - 0:12 PoC-Demo (Techniknachweis)

1. Login als BASIC (`TAA2001`).
2. Admin-Endpunkt pruefen -> erwartet `403`.
3. Audit-Log abrufen als BASIC -> erwartet `403` (nur ADMIN erlaubt).
4. Login als ADMIN (`TAA1001`).
5. Gueltige Regel-Aenderung mit Jira-Ref (`IPA-201`) absenden.
6. Audit laden als ADMIN -> Eintraege sichtbar.
7. Ungueltige Jira-Ref (`NRT-1`) testen -> erwartet `400`.

### 0:12 - 0:22 Validierung gegen Kriterien

Jedes Kriterium mit Stakeholder als **Erfuellt / Offen / Anpassung** markieren.

### 0:22 - 0:28 Entscheidungen und Priorisierung

- Umsetzungsentscheid (Go/Go mit Anpassungen/No-Go)
- Priorisierung der naechsten Schritte (Stories/Folgeaufgaben)
- Offene Risiken und Gegenmassnahmen festhalten

### 0:28 - 0:30 Abschluss

- Zusammenfassung in 3 Punkten
- Verbindliche Naechste Schritte + Verantwortlichkeiten

## Validierungs-Checkliste (live ausfuellen)

| Nr. | Kriterium | Nachweis in Demo | Status | Kommentar Stakeholder |
|---|---|---|---|---|
| V1 | Login mit TAA-Format funktioniert | `/api/poc/login` liefert Token + Rolle | ☐ Erfuellt ☐ Offen ☐ Anpassung | |
| V2 | RBAC greift korrekt | BASIC auf Admin-Endpunkt -> `403` | ☐ Erfuellt ☐ Offen ☐ Anpassung | |
| V3 | Audit ist nur fuer ADMIN sichtbar | BASIC auf `/api/poc/audit` -> `403`; ADMIN -> `200` | ☐ Erfuellt ☐ Offen ☐ Anpassung | |
| V4 | Jira-Validierung ist aktiv | Ungueltige Ref -> `400`, gueltige Ref -> akzeptiert | ☐ Erfuellt ☐ Offen ☐ Anpassung | |
| V5 | Audit-Eintrag ist nachvollziehbar | Eintrag mit Zeit, Actor, Action, Jira sichtbar | ☐ Erfuellt ☐ Offen ☐ Anpassung | |
| V6 | Entscheidungsgrundlage ist ausreichend | Stakeholder kann naechste Schritte festlegen | ☐ Erfuellt ☐ Offen ☐ Anpassung | |

## Entscheidungsprotokoll (G02 Nachweis)

- **Datum/Zeit:** ____________________
- **Teilnehmer:** Damir Peric, Waibel Kenta
- **Gezeigter Scope:** Login, RBAC, Admin-only Audit, Jira-Validierung, Audit-Ansicht
- **Entscheid:** ☐ Go  ☐ Go mit Anpassungen  ☐ No-Go
- **Begruendung:** ______________________________________________
- **Vereinbarte Anpassungen:** ___________________________________
- **Naechste Schritte (Story/Task):** _____________________________
- **Verantwortlich + Termin:** ___________________________________

## Mapping fuer Guetestufe 3 (beide Nachweise)

### A14 Machbarkeitsstudie (PoC)

1. **Umfang identifiziert** -> Abschnitt "Ziel", "Scope", "Out of Scope" in PoC-Doku.
2. **Erfolgskriterien definiert** -> Validierungs-Checkliste V1-V6.
3. **Brauchbare Rueckschluesse** -> Status + Kommentare pro Kriterium.
4. **Solide Grundlage fuer naechste Schritte** -> Entscheidungsprotokoll mit Aufgaben.

### Stakeholder-Validierung (G02)

1. **Relevantes Feedback eingeholt** -> Live-Kommentare in Checkliste.
2. **Feedback nachvollziehbar dokumentiert** -> Entscheidungsprotokoll.
3. **Feedback in naechste Arbeit ueberfuehrt** -> konkrete Folgeaufgaben mit Owner/Termin.

## Artefakte fuer den IPA-Bericht

- Referenz auf PoC: `nrt-poc/docs/POC_DOKUMENTATION.md`
- Referenz auf Validierung: `nrt-poc/docs/VALIDIERUNG.md`
- Optional Screenshot-Anhang:
  - BASIC `403` auf Audit
  - ADMIN `200` auf Audit mit Eintraegen
  - Jira-Validation `400` bei ungueltiger Ref
