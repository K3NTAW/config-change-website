import type { NextRequest } from "next/server";
import { verifySessionToken, type SessionPayload } from "./jwt";
import { SESSION_COOKIE_NAME } from "@/constants";
import { hasRequiredRole } from "@/lib/auth/rbac";

export async function getSessionFromRequest(
  req: NextRequest,
): Promise<SessionPayload | null> {
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    try {
      return await verifySessionToken(cookieToken);
    } catch {
    }
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireRole(
  req: NextRequest,
  allowed: string[],
): Promise<{ session: SessionPayload } | { error: Response }> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      error: new Response(JSON.stringify({ error: "Nicht angemeldet." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  if (!allowed.some((r) => hasRequiredRole(session.role, r))) {
    return {
      error: new Response(JSON.stringify({ error: "Keine Berechtigung." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { session };
}
