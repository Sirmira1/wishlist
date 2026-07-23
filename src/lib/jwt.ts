import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Edge-safe JWT helpers (no Node APIs, no Prisma) so they can run in middleware.

export const SESSION_COOKIE = "lw_session";

export type Role = "ADMIN" | "USER";

export type SessionPayload = JWTPayload & {
  sub: string; // user id
  tv: number; // token version — must match User.tokenVersion
  role: Role;
};

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    // Dev-only fallback so the app boots without config. NEVER rely on this in prod.
    "dev-insecure-secret-change-me-in-production-env-please";
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: { sub: string; tv: number; role: Role },
  expiresInSeconds: number
): Promise<string> {
  return new SignJWT({ sub: payload.sub, tv: payload.tv, role: payload.role })
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
