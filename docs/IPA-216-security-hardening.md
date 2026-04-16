# IPA-216: Security Hardening (Least Privilege, Input Validation)

## Input validation (Zod)

| Bereich | Schema | Datei |
|--------|--------|--------|
| Login | `loginBodySchema` | `src/lib/validation/api-bodies.ts` |
| Passwort vergessen | `forgotPasswordBodySchema` (TAA oder `@swisscom.com`) | idem |
| Passwort zurücksetzen | `resetPasswordBodySchema` | idem |
| Admin Rolle | `adminAssignRoleBodySchema` (`ADMIN` \| `BASIC`, `.strict()`) | idem |
| Ablehnung Antrag | `rejectRegistrationBodySchema` | idem |
| Route-Parameter `[id]` | `prismaCuidParamSchema` | idem |
| Registrierung | `registerRequestSchema` | `src/lib/validation/register.ts` (bestehend) |

Parsing-Hilfe: `parseJsonWithSchema` in `src/lib/api/parse-request-body.ts`.

## SQL-Injection

Alle DB-Zugriffe über **Prisma** (parametrisierte Queries). Keine `$queryRaw` mit User-String-Konkatenation. Negativtest: `tests/unit/api-bodies-security.test.ts` (Audit-`where`-Objekt).

## Logging

Strukturierte Logs durchlaufen **`redactForLogs`** (`src/lib/logger.ts`): Schlüssel wie `password`, `token`, `secret`, … → `[REDACTED]`. Passwort-Reset ohne Klartext-Identifier im Warn-Log (nur `identifierLen`).

## Session-Cookie (JWT)

`httpOnly`, `sameSite=lax`, **`secure`** wenn `NODE_ENV === "production"` oder `FORCE_SECURE_COOKIES=true` — zentrale Optionen in `src/lib/auth/session-cookie.ts` (Login, Logout, Middleware bei ungültigem Token).

## Least privilege (C08)

Unverändert: `requireRole` / RBAC in `request-session.ts` und `rbac.ts`; Admin-Routen nur mit `ADMIN`.

## Tests

- `tests/unit/log-redaction.test.ts`
- `tests/unit/api-bodies-security.test.ts`
