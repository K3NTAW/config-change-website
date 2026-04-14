import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { signSessionToken } from "@/lib/auth/jwt";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { SESSION_COOKIE_NAME } from "@/constants";

beforeAll(() => {
  process.env.JWT_SECRET = "01234567890123456789012345678901";
});

describe("getSessionFromRequest (IPA-205)", () => {
  it("liest Session aus httpOnly Cookie", async () => {
    const token = await signSessionToken({ sub: "u1", username: "TAA0001", role: "BASIC" });
    const req = new NextRequest("http://localhost/api/some-route", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const session = await getSessionFromRequest(req);
    expect(session).not.toBeNull();
    expect(session?.username).toBe("TAA0001");
    expect(session?.role).toBe("BASIC");
  });

  it("liest Session aus Bearer-Header (API-Client Fallback)", async () => {
    const token = await signSessionToken({ sub: "u2", username: "TAA0002", role: "ADMIN" });
    const req = new NextRequest("http://localhost/api/some-route", {
      headers: { authorization: `Bearer ${token}` },
    });
    const session = await getSessionFromRequest(req);
    expect(session).not.toBeNull();
    expect(session?.role).toBe("ADMIN");
  });

  it("Cookie hat Vorrang vor Bearer-Header", async () => {
    const cookieToken = await signSessionToken({ sub: "u3", username: "TAA0003", role: "BASIC" });
    const bearerToken = await signSessionToken({ sub: "u4", username: "TAA0004", role: "ADMIN" });
    const req = new NextRequest("http://localhost/api/some-route", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${cookieToken}`,
        authorization: `Bearer ${bearerToken}`,
      },
    });
    const session = await getSessionFromRequest(req);
    expect(session?.username).toBe("TAA0003");
  });

  it("gibt null zurück wenn kein Token vorhanden", async () => {
    const req = new NextRequest("http://localhost/api/some-route");
    const session = await getSessionFromRequest(req);
    expect(session).toBeNull();
  });

  it("gibt null zurück bei ungültigem Token", async () => {
    const req = new NextRequest("http://localhost/api/some-route", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=this.is.not.a.valid.token` },
    });
    const session = await getSessionFromRequest(req);
    expect(session).toBeNull();
  });

  it("Negativtest: falsches Passwort → 401 (Login-Route Logik)", async () => {
    // Verify that a tampered token (wrong signature) is rejected
    const token = await signSessionToken({ sub: "u5", username: "TAA0005", role: "BASIC" });
    const tampered = token.slice(0, -4) + "XXXX";
    const req = new NextRequest("http://localhost/api/some-route", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${tampered}` },
    });
    const session = await getSessionFromRequest(req);
    expect(session).toBeNull();
  });
});
