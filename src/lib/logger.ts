export type LogLevel = "INFO" | "WARN" | "ERROR";

/** Keys whose values must never appear in plaintext logs (IPA-216). */
const SENSITIVE_KEY =
  /password|passwort|token|secret|authorization|apikey|bearer|rawtoken|newpassword|oldpassword|accesstoken|refreshtoken|cookie|set-cookie/i;

function redactForLogs(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactForLogs);
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (SENSITIVE_KEY.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactForLogs(v);
      }
    }
    return out;
  }
  return value;
}

function emit(level: LogLevel, payload: Record<string, unknown>) {
  const safe = redactForLogs(payload) as Record<string, unknown>;
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: "nrt-ipa",
      ...safe,
    }),
  );
}

export function logInfo(payload: Record<string, unknown>) {
  emit("INFO", payload);
}

export function logWarn(payload: Record<string, unknown>) {
  emit("WARN", payload);
}

export function logError(payload: Record<string, unknown>) {
  emit("ERROR", payload);
}

/**
 * Structured server-side diagnostics: error type, message, stack, and request context.
 * Never forward `stack` or internal messages to API clients (IPA-215 / G16).
 */
export function logException(
  err: unknown,
  ctx: Record<string, unknown>,
): void {
  const errorType =
    err instanceof Error ? err.constructor.name : typeof err;
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logError({
    action: "EXCEPTION",
    errorType,
    message,
    stack,
    ...(redactForLogs(ctx) as Record<string, unknown>),
  });
}

/** Exported for unit tests (redaction rules). */
export { redactForLogs };
