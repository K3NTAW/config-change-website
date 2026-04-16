import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { AppHttpError } from "@/lib/api/app-http-error";
import { RegistrationError } from "@/lib/auth/registration-error";
import { logError, logException, logWarn } from "@/lib/logger";

export type RouteErrorContext = {
  method: string;
  /** Stable label for logs, e.g. `/api/auth/login` */
  route: string;
  path?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Maps thrown values to JSON responses and structured logs (timestamp + errorType + context + stack in logs only).
 */
export function handleRouteError(
  err: unknown,
  ctx: RouteErrorContext,
): NextResponse {
  if (err instanceof AppHttpError) {
    if (err.statusCode >= 500) {
      logError({
        action: "APP_HTTP_ERROR",
        code: err.code,
        httpStatus: err.statusCode,
        route: ctx.route,
        method: ctx.method,
        path: ctx.path,
        errorType: err.name,
        message: err.message,
        stack: err.stack,
      });
    } else {
      logWarn({
        action: "APP_HTTP_ERROR",
        code: err.code,
        httpStatus: err.statusCode,
        route: ctx.route,
        method: ctx.method,
        path: ctx.path,
        errorType: err.name,
        message: err.message,
      });
    }
    return jsonError(err.message, err.statusCode);
  }

  if (err instanceof RegistrationError) {
    if (err.code === "VALIDATION") {
      logWarn({
        action: "REGISTRATION_VALIDATION",
        route: ctx.route,
        httpStatus: err.httpStatus,
        fields: err.fields,
      });
      return NextResponse.json(
        { error: err.message, fields: err.fields },
        { status: err.httpStatus },
      );
    }
    if (err.code === "CONFLICT") {
      logWarn({
        action: "REGISTRATION_CONFLICT",
        route: ctx.route,
        httpStatus: err.httpStatus,
      });
      return jsonError(err.message, err.httpStatus);
    }
    logException(err, { route: ctx.route, method: ctx.method, path: ctx.path });
    return jsonError(
      "Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      500,
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logException(err, {
      route: ctx.route,
      method: ctx.method,
      path: ctx.path,
      prismaCode: err.code,
    });
    if (err.code === "P2025") {
      return jsonError("Ressource nicht gefunden.", 404);
    }
    if (err.code === "P2002") {
      return jsonError("Datensatz existiert bereits.", 409);
    }
    return jsonError(
      "Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      500,
    );
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logException(err, { route: ctx.route, method: ctx.method, path: ctx.path });
    return jsonError(
      "Ungültige Anfrage (Datenbankvalidierung).",
      400,
    );
  }

  logException(err, { route: ctx.route, method: ctx.method, path: ctx.path });
  return jsonError(
    "Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    500,
  );
}
