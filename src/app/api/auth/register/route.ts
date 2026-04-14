import { NextRequest, NextResponse } from "next/server";
import {
  createRegistrationRequest,
  RegistrationError,
} from "@/lib/auth/register-service";
import { logError, logInfo, logWarn } from "@/lib/logger";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    logWarn({
      action: "REGISTER_INVALID_JSON",
      httpStatus: 400,
    });
    return NextResponse.json(
      { error: "Der Anfrage-Body muss gültiges JSON sein." },
      { status: 400 },
    );
  }

  try {
    const result = await createRegistrationRequest(body);
    logInfo({
      action: "REGISTER_CREATED",
      requestId: result.id,
      status: result.status,
      httpStatus: 201,
    });
    return NextResponse.json(
      { id: result.id, status: result.status },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof RegistrationError) {
      if (e.code === "VALIDATION") {
        logWarn({
          action: "REGISTER_VALIDATION_FAILED",
          httpStatus: e.httpStatus,
          fields: e.fields,
        });
        return NextResponse.json(
          { error: e.message, fields: e.fields },
          { status: e.httpStatus },
        );
      }
      if (e.code === "CONFLICT") {
        return NextResponse.json({ error: e.message }, { status: e.httpStatus });
      }
    }

    logError({
      action: "REGISTER_INTERNAL",
      message: e instanceof Error ? e.message : String(e),
      httpStatus: 500,
    });
    return NextResponse.json(
      { error: "Ein interner Fehler ist aufgetreten." },
      { status: 500 },
    );
  }
}
