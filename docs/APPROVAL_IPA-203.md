# Admin: Registrierungsanträge (IPA-203)

## Ablauf

1. Antragsteller stellt einen Antrag (IPA-202) — Status **ausstehend**.
2. Ein **Administrator** meldet sich an und sieht die offenen Anträge.
3. **Genehmigen:** Es wird ein **Benutzerkonto** mit Rolle **BASIC** angelegt, ein **neues temporäres Passwort** generiert (das beim Antrag gewählte Passwort wird nicht übernommen) und per **E-Mail** zugestellt — oder bei fehlendem SMTP **protokolliert** (lokal nachvollziehbar). Das Konto ist für den **Passwortwechsel beim ersten Login** vorgemerkt (Folge IPA-204).
4. **Ablehnen:** Der Antrag erhält den Status **abgelehnt**, optional mit **Bemerkung**.

## Zugriff

Nur **ADMIN**. BASIC-Benutzer erhalten bei Admin-Endpunkten **403**. Die Prüfung erfolgt über ein **JWT**, das nach erfolgreichem Login ausgestellt wird.

## Lokal testen

- Datenbank migrieren und **Seed** ausführen (Demo-Admin und Demo-Basic mit bekannten Passwörtern — siehe Konsolenhinweis nach `npm run db:seed`).
- **`JWT_SECRET`** in `.env` setzen.
- **`/admin/registrations`**: als Admin anmelden, Liste laden, Antrag genehmigen oder ablehnen.

## E-Mail

Wenn **SMTP**-Variablen gesetzt sind, wird eine echte Mail versendet; sonst erscheint der Inhalt in den **strukturierten Logs** / Konsole.
