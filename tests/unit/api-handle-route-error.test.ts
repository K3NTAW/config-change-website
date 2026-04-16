import { describe, it, expect } from "vitest";
import { httpErrors } from "@/lib/api/app-http-error";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { RegistrationError } from "@/lib/auth/registration-error";
import { Prisma } from "@prisma/client";

describe("handleRouteError (IPA-215)", () => {
  const ctx = { method: "GET", route: "/api/test" };

  it("AppHttpError 400 → gleiche Meldung und Status", () => {
    const res = handleRouteError(httpErrors.badRequest("Ungültig."), ctx);
    expect(res.status).toBe(400);
  });

  it("AppHttpError 500 → generische Meldung für Client", async () => {
    const res = handleRouteError(httpErrors.internal(), ctx);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain("interner Fehler");
  });

  it("RegistrationError VALIDATION → 400 mit fields", async () => {
    const err = new RegistrationError(
      "VALIDATION",
      400,
      "Die Eingaben sind ungültig.",
      { username: "Pflichtfeld" },
    );
    const res = handleRouteError(err, ctx);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string; fields?: Record<string, string> };
    expect(json.fields?.username).toBe("Pflichtfeld");
  });

  it("Prisma P2025 → 404", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("not found", {
      code: "P2025",
      clientVersion: "test",
    });
    const res = handleRouteError(err, ctx);
    expect(res.status).toBe(404);
  });

  it("unbekannter Fehler → 500 ohne Stack im Body", async () => {
    const res = handleRouteError(new Error("secret db"), ctx);
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error: string; stack?: string };
    expect(json.error).not.toContain("secret");
    expect(json.stack).toBeUndefined();
  });
});
