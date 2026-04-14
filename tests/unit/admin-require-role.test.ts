import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { signSessionToken } from "@/lib/auth/jwt";
import { requireRole } from "@/lib/auth/request-session";

describe("requireRole (IPA-203)", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "01234567890123456789012345678901";
  });

  it("ADMIN darf Admin-Endpunkt-Logik", async () => {
    const token = await signSessionToken({
      sub: "u1",
      username: "TAA0001",
      role: "ADMIN",
    });
    const req = new NextRequest("http://localhost/api/admin/x", {
      headers: { authorization: `Bearer ${token}` },
    });
    const g = await requireRole(req, ["ADMIN"]);
    expect("session" in g).toBe(true);
    if ("session" in g) expect(g.session.role).toBe("ADMIN");
  });

  it("BASIC erhält 403 für Admin-only", async () => {
    const token = await signSessionToken({
      sub: "u2",
      username: "TAA0002",
      role: "BASIC",
    });
    const req = new NextRequest("http://localhost/api/admin/x", {
      headers: { authorization: `Bearer ${token}` },
    });
    const g = await requireRole(req, ["ADMIN"]);
    expect("error" in g).toBe(true);
    if ("error" in g) expect(g.error.status).toBe(403);
  });
});
