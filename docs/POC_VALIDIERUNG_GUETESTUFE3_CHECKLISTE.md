# PoC + Validierung Checkliste (Gütestufe 3)

## Zweck

Diese Vorlage kombiniert **Machbarkeitsstudie (PoC)** und **Stakeholder-Validierung** in einem Dokument.
Sie ist für eine **30-Minuten Sitzung (15 min PoC + 15 min Validierung)** ausgelegt und kann direkt als Nachweisgrundlage für den IPA-Bericht verwendet werden.

---

## 0) Sitzungs-Metadaten

- **Datum:** _________09.04.2026___________
- **Uhrzeit:** ______14:30______________
- **Dauer gesamt:** 30 Minuten
- **Teilnehmer:** Damir Peric, Waibel Kenta, Hübscher Kay
- **Umgebung (lokal/stage):** _______lokal_____________
- **PoC-Version/Branch:** ___________________

---

## 1) PoC-Teil (15 Minuten) - A14

### 1.1 Umfang und Abgrenzung (Pflicht für Gütestufe 3)

- [ ] Umfang ist klar beschrieben (was getestet wird)
- [ ] Out of Scope ist klar beschrieben (was nicht getestet wird)
- [ ] Bezug zur Aufgabenstellung ist hergestellt

**Notizen (Umfang / Out of Scope):**

```

```

### 1.2 Erfolgskriterien (messbar)

- [ ] Kriterium P1: Login mit TAA + Passwort liefert Rolle
- [ ] Kriterium P2: BASIC auf Admin-Endpunkt -> 403
- [ ] Kriterium P3: Audit nur für ADMIN zugänglich
- [ ] Kriterium P4: Ungültige Jira-Ref -> 400
- [ ] Kriterium P5: Erfolgreiche Aktionen sind im Audit sichtbar

**Erfolgskriterien (falls angepasst):**

```

```

### 1.3 Demo-Protokoll (live)

| Schritt | Aktion | Erwartet | Ist-Ergebnis | Status |
|---|---|---|---|---|
| 1 | Login BASIC (`TAA2001`) | Login ok |  | ☐ |
| 2 | Admin-Endpunkt als BASIC | `403` |  | ☐ |
| 3 | Audit-Endpunkt als BASIC | `403` |  | ☐ |
| 4 | Login ADMIN (`TAA1001`) | Login ok |  | ☐ |
| 5 | Rule-Change mit `IPA-201` | `200` + Audit |  | ☐ |
| 6 | Rule-Change mit `NRT-1` | `400` |  | ☐ |
| 7 | Audit als ADMIN laden | `200` + Einträge |  | ☐ |

### 1.4 Rückschlüsse / Entscheidungsgrundlage (Pflicht für Gütestufe 3)

- [ ] PoC liefert brauchbare Rückschlüsse zur Anwendbarkeit
- [ ] Offene Punkte/Risiken sind dokumentiert
- [ ] Nächste Schritte sind aus dem Ergebnis ableitbar

**Rückschlüsse (kurz):**

```

```

**Risiken + Gegenmassnahmen:**

```

```

**Screenshot-Platzhalter (PoC):**

- [ ] Screenshot 1: BASIC -> Admin `403`
- [ ] Screenshot 2: BASIC -> Audit `403`
- [ ] Screenshot 3: ADMIN -> Audit `200`
- [ ] Screenshot 4: Jira-Validation `400` bei ungültiger Ref
- **Dateipfade/Bildnamen:** ________________________________

---

## 2) Validierungsteil (15 Minuten) - Stakeholder (G02)

### 2.1 Feedbackaufnahme (strukturierte Validierung)

| Validierungspunkt | Feedback Damir | Entscheidung |
|---|---|---|
| Auth-Flow verständlich/praktisch |  | ☐ Accept ☐ Change ☐ Postpone |
| RBAC-Regeln korrekt |  | ☐ Accept ☐ Change ☐ Postpone |
| Audit-Sicht nur für ADMIN passend |  | ☐ Accept ☐ Change ☐ Postpone |
| Jira-Validierung ausreichend |  | ☐ Accept ☐ Change ☐ Postpone |
| UI/Bedienung für PoC ausreichend |  | ☐ Accept ☐ Change ☐ Postpone |

### 2.2 Beschlüsse und Follow-ups

- [ ] Gesamtentscheid festgehalten: ☐ Go ☐ Go mit Anpassungen ☐ No-Go
- [ ] Konkrete Anpassungen dokumentiert
- [ ] Follow-up Aufgaben mit Owner und Termin dokumentiert

**Gesamtentscheid + Begründung:**

```

```

**Konkrete Anpassungen:**

```

```

**Follow-up Aufgaben (Story/Task, Owner, Termin):**

| Aufgabe | Story/Task | Owner | Termin |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

**Screenshot-Platzhalter (Validierung):**

- [ ] Screenshot 5: Gemeinsamer Entscheid (optional Notiz/Screenshot)
- [ ] Screenshot 6: Priorisierte Follow-up Liste
- **Dateipfade/Bildnamen:** ________________________________

---

## 3) Gütestufe-3 Selbstcheck (Final)

### A14 Machbarkeitsstudie

- [ ] Umfang korrekt identifiziert und beschrieben
- [ ] Sinnvolle Erfolgskriterien identifiziert und beschrieben
- [ ] Brauchbare Rückschlüsse zur Anwendbarkeit dokumentiert
- [ ] Solide, dokumentierte Grundlage für nächste Schritte vorhanden

### Stakeholder-Validierung (G02)

- [ ] Relevantes Stakeholder-Feedback eingeholt
- [ ] Feedback nachvollziehbar dokumentiert
- [ ] Entscheidungen klar festgehalten
- [ ] Feedback in konkrete nächste Schritte überführt

**Wenn alle Punkte angehakt sind, ist die Evidenzbasis für Gütestufe 3 vorhanden.**

---

## 4) Transfer in IPA-Bericht (Copy-Ready Reminder)

- [ ] Abschnitt `Machbarkeitsstudie / Proof of Concept` mit Ergebnissen ergänzt
- [ ] Abschnitt `Stakeholder-Validierung (G02)` mit Beschluss ergänzt
- [ ] Screenshots als Abbildungen referenziert (falls verwendet)
- [ ] Story-/Task-Referenzen im Bericht nachgezogen

**Kurztext für Bericht (optional):**

```
Im Rahmen einer 30-minütigen kombinierten Sitzung (15 min PoC, 15 min Stakeholder-Validierung) wurde die technische Machbarkeit der Kernanforderungen Authentifizierung, RBAC und Auditierung nachgewiesen. Die Erfolgskriterien wurden mehrheitlich erfüllt; offene Punkte wurden als konkrete Folgeaufgaben mit Verantwortlichkeiten und Terminierung übernommen. Damit liegt eine belastbare Entscheidungsgrundlage für die produktive IPA-Umsetzung vor.
```
