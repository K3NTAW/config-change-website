import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * Validates JSON body with Zod; returns first issue message (German copy from schema).
 */
export function parseJsonWithSchema<T>(
  body: unknown,
  schema: z.ZodType<T>,
):
  | { ok: true; data: T }
  | { ok: false; response: NextResponse } {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg =
      r.error.issues[0]?.message ?? "Die Eingaben sind ungültig.";
    return {
      ok: false,
      response: NextResponse.json({ error: msg }, { status: 400 }),
    };
  }
  return { ok: true, data: r.data };
}
