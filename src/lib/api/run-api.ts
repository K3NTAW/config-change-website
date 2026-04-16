import type { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";

/**
 * Wraps a Route Handler body: uncaught errors become safe JSON + structured logs (IPA-215).
 * Auth gates that return `Response` (e.g. requireRole) should be returned as-is inside `handler`.
 */
export async function runApi(
  req: NextRequest,
  method: string,
  route: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    return handleRouteError(err, {
      method,
      route,
      path: req.nextUrl.pathname,
    });
  }
}
