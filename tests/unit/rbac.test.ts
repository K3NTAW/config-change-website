import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { signSessionToken } from "@/lib/auth/jwt";
import { requireRole } from "@/lib/auth/request-session";
import { isAdminPageRoute, hasRequiredRole, ROLES } from "@/lib/auth/rbac";

beforeAll(() => {
  process.env.JWT_SECRET = "01234567890123456789012345678901";
});

describe("isAdminPageRoute (IPA-207)", () => {
  it("erkennt /admin als Admin-Route", () => {
    expect(isAdminPageRoute("/admin")).toBe(true);
    expect(isAdminPageRoute("/admin/registrations")).toBe(true);
    expect(isAdminPageRoute("/admin/users")).toBe(true);
  });

  it("lässt öffentliche und Basic-Routen durch", () => {
    expect(isAdminPageRoute("/")).toBe(false);
    expect(isAdminPageRoute("/login")).toBe(false);
    expect(isAdminPageRoute("/register")).toBe(false);
    expect(isAdminPageRoute("/nrt-ruleset")).toBe(false);
  });
});

describe("hasRequiredRole (IPA-207 – Least Privilege)", () => {
  it("ADMIN darf auf ADMIN-Routen zugreifen", () => {
    expect(hasRequiredRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
  });

  it("ADMIN darf auch auf BASIC-Routen zugreifen", () => {
    expect(hasRequiredRole(ROLES.ADMIN, ROLES.BASIC)).toBe(true);
  });

  it("BASIC darf auf BASIC-Routen zugreifen", () => {
    expect(hasRequiredRole(ROLES.BASIC, ROLES.BASIC)).toBe(true);
  });

  it("BASIC darf NICHT auf ADMIN-Routen zugreifen", () => {
    expect(hasRequiredRole(ROLES.BASIC, ROLES.ADMIN)).toBe(false);
  });
});

describe("requireRole API Guard (IPA-207)", () => {
  it("ADMIN darf Admin-Endpunkt aufrufen", async () => {
    const token = await signSessionToken({ sub: "u1", username: "TAA0001", role: "ADMIN" });
    const req = new NextRequest("http://localhost/api/admin/registration-requests", {
      headers: { authorization: `Bearer ${token}` },
    });
    const result = await requireRole(req, ["ADMIN"]);
    expect("session" in result).toBe(true);
  });

  it("Negativtest: BASIC erhält 403 auf Admin-Endpunkt", async () => {
    const token = await signSessionToken({ sub: "u2", username: "TAA0002", role: "BASIC" });
    const req = new NextRequest("http://localhost/api/admin/registration-requests", {
      headers: { authorization: `Bearer ${token}` },
    });
    const result = await requireRole(req, ["ADMIN"]);
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(403);
  });

  it("Negativtest: kein Token → 401", async () => {
    const req = new NextRequest("http://localhost/api/admin/registration-requests");
    const result = await requireRole(req, ["ADMIN"]);
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(401);
  });
});
