# Sign-up Request mit Validierung (IPA-202)

## Ziel

Swisscom-Mitarbeitende können einen **Registrierungsantrag** stellen. Der Antrag wird mit Status **`PENDING_APPROVAL`** persistiert; die eigentliche Freigabe und Anlage eines `users`-Datensatzes erfolgt in **IPA-203**.

## Persistenz

Tabelle **`registration_requests`** (Prisma-Modell `RegistrationRequest`):

| Feld | Bedeutung |
|------|------------|
| `username` | TAA-Kennung (`TAA` + 4 Ziffern) |
| `email` | Nur `@swisscom.com` (normalisiert kleingeschrieben) |
| `passwordHash` | **bcrypt** (12 Runden) |
| `status` | `PENDING_APPROVAL` \| `REJECTED` \| `APPROVED` (Freigabe-Logik später) |

## API

- **`POST /api/auth/register`**  
  Body: `{ "username", "email", "password" }`  
  Erfolg: **201** mit `{ id, status }`.  
  Validierung: **400** mit `fields`.  
  Konflikt (bereits User oder offener Antrag): **409**.

## Validierung

- Zod-Schema in `src/lib/validation/register.ts`
- Serverseitige Duplikatprüfung gegen `users` und offene `registration_requests`

## Logging / Fehleranalyse

Strukturierte JSON-Zeilen über `src/lib/logger.ts` (`action`, `httpStatus`, ggf. `fields`).

## UI (lokal)

- **`/register`** — minimales Formular für End-to-End-Tests

## Tests

- `tests/unit/register-validation.test.ts` — positiv/negativ Zod
- `tests/unit/register-service.test.ts` — Konflikt- und Erfolgsfall mit gemocktem Prisma

## E-Mail-Service

Versand von Benachrichtigungen an Admins ist **nicht** Teil dieser Story; DoR verweist auf Konfiguration lokal/dev für Folge-Stories.
