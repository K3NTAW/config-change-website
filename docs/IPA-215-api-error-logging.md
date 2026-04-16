# IPA-215: API-Fehlerbehandlung und Logging

## G16 (Dokumentation)

| # | Inhalt |
|---|--------|
| 1 | Einheitliche HTTP-Codes: 400, 401, 403, 404, 409, 422, 500 je nach Fall |
| 2 | Fehlerklassen: `AppHttpError`, `RegistrationError`, Prisma-Fehler → passender Status |
| 3 | Server-Logs: JSON mit `timestamp`, `level`, `errorType`, Kontext (`route`, `method`, `path`, `phase`), `stack` bei Exceptions |
| 4 | Client: nur sichere Kurzmeldungen; keine Stacks, keine Env-Details |

## Code

| Modul | Zweck |
|-------|--------|
| `src/lib/api/app-http-error.ts` | `AppHttpError`, `httpErrors.*` |
| `src/lib/api/handle-route-error.ts` | Zentrale Abbildung Throw → `NextResponse.json` |
| `src/lib/api/run-api.ts` | `runApi(req, method, route, handler)` |
| `src/lib/auth/registration-error.ts` | `RegistrationError` (ohne Prisma-Import) |
| `src/lib/logger.ts` | `logInfo`, `logWarn`, `logError`, `logException` |

## Routen

- Auth, Admin, Init, Audit, Session: `runApi` + bestehende Statuslogik (`requireRole` → 401/403).
- `POST /api/nrt-ruleset/process` und verwandte Hilfsfunktionen: `try/catch` + `logException`, Antworten `{ success, message }` ohne interne Fehlertexte.

## Tests

`tests/unit/api-handle-route-error.test.ts`
