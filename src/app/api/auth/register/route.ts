import { NextRequest, NextResponse } from "next/server";
import { createRegistrationRequest } from "@/lib/auth/register-service";
import { logInfo, logWarn } from "@/lib/logger";
import { runApi } from "@/lib/api/run-api";

export async function POST(req: NextRequest) {
  return runApi(req, "POST", "/api/auth/register", async () => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      logWarn({
        action: "REGISTER_INVALID_JSON",
        httpStatus: 400,
        route: "/api/auth/register",
      });
      return NextResponse.json(
        { error: "Der Anfrage-Body muss gültiges JSON sein." },
        { status: 400 },
      );
    }

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
  });
}
