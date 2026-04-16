/** Application-level HTTP error with a safe, user-facing `message` (German UI copy). */
export class AppHttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    statusCode: number,
    message: string,
    code: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AppHttpError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppHttpError.prototype);
  }
}

/** Factory helpers — messages are shown to clients; keep them generic for 5xx. */
export const httpErrors = {
  badRequest: (msg: string) =>
    new AppHttpError(400, msg, "BAD_REQUEST"),
  unauthorized: (msg = "Nicht angemeldet.") =>
    new AppHttpError(401, msg, "UNAUTHORIZED"),
  forbidden: (msg = "Keine Berechtigung.") =>
    new AppHttpError(403, msg, "FORBIDDEN"),
  notFound: (msg = "Nicht gefunden.") =>
    new AppHttpError(404, msg, "NOT_FOUND"),
  conflict: (msg: string) =>
    new AppHttpError(409, msg, "CONFLICT"),
  /** Always use the same generic copy for unexpected server faults. */
  internal: () =>
    new AppHttpError(
      500,
      "Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      "INTERNAL",
    ),
};
