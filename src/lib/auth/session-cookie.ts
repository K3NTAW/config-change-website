/**
 * Session-Cookie: `httpOnly`, `sameSite=lax`, `secure` in Production (HTTPS) bzw. bei
 * `FORCE_SECURE_COOKIES=true` — entspricht „HTTPS-only“ für das Token in produktiven Deployments.
 */
export function isSecureSessionCookie(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.FORCE_SECURE_COOKIES === "true"
  );
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: isSecureSessionCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearSessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: isSecureSessionCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
