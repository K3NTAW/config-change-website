/**
 * Strukturierte Logs (JSON-Zeilen) für nachvollziehbare Fehleranalyse (u. a. HTTP-Status, Aktion).
 */

export type LogLevel = "INFO" | "WARN" | "ERROR";

function emit(level: LogLevel, payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: "nrt-ipa",
      ...payload,
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
