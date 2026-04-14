import { SignJWT, jwtVerify } from "jose";

const getSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET fehlt oder ist zu kurz (min. 16 Zeichen).");
  }
  return new TextEncoder().encode(s);
};

export type SessionPayload = {
  sub: string;
  username: string;
  role: string;
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
  const sub = payload.sub;
  const username = payload.username;
  const role = payload.role;
  if (typeof sub !== "string" || typeof username !== "string" || typeof role !== "string") {
    throw new Error("Ungültiges Token-Payload.");
  }
  return { sub, username, role };
}
