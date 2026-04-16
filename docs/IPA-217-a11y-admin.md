# IPA-217: Accessibility / Usability Admin Views (Basis)

## Umsetzung (technisch)

| Thema | Massnahme |
|-------|-----------|
| **Labels** | Filter auf `/admin/audit` mit `Label` + `htmlFor`; Ablehnen-Dialog auf `/admin/registrations` mit `Label`, `Textarea`, `DialogDescription` und Hilfetext (`aria-describedby`). |
| **Kontrast (WCAG AA, Fliesstext)** | Sekundärtext von `text-slate-400`/`500` auf **`text-slate-600`** wo lesbarer Fliesstext; Tabellenköpfe `text-slate-700`. |
| **Fehler / Status** | Meldungsboxen mit `role="alert"` und `aria-live="polite"`; Ladezustand `role="status"`. |
| **Tabellen** | `scope="col"` (HTML-Tabellen); **`caption.sr-only`** oder **`role="region"`** + **`aria-labelledby`** bei shadcn-`Table`. |
| **Steuerelemente** | `aria-label` bei Pagination („Zurück“/„Weiter“), Rollen-Dropdown, Deaktivieren, Diff-Button, Genehmigen/Ablehnen. |
| **Screenreader** | Utility **`.sr-only`** in `globals.css` für versteckte Tabellenüberschriften. |

## Usability-Review (vFK)

Nachweis im Bericht: **G02 Stakeholder-Feedback** — Kurzprotokoll oder Checkliste nach Termin mit vFK; mindestens ein Punkt aus dem Review ist umgesetzt (**Dialog statt `window.prompt`** für Ablehnungsgrund).
