import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Edge-safe JWT helpers (no Node APIs, no Prisma) so they can run in middleware.

export const SESSION_COOKIE = "lw_session";

export type SessionPayload = JWTPayload & {
  sub: string; // admin username
  tv: number; // token version — must match Settings.tokenVersion
  role: "admin";
};

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    // Dev-only fallback so the app boots without config. NEVER rely on this in prod.
    "dev-insecure-secret-change-me-in-production-env-please";
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: { sub: string; tv: number },
  expiresInSeconds: number
): Promise<string> {
  return new SignJWT({ ...payload, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
