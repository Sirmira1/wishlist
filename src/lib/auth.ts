import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SESSION_COOKIE, signSession, verifySessionToken } from "./jwt";

const SETTINGS_ID = "singleton";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Get the singleton Settings row, creating a blank one on first access. */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: SETTINGS_ID } });
}

/** True once the admin password has been created (first-run setup complete). */
export async function isSetupComplete(): Promise<boolean> {
  const settings = await prisma.settings.findUnique({
    where: { id: SETTINGS_ID },
    select: { passwordHash: true },
  });
  return Boolean(settings?.passwordHash);
}

/** Issue a signed session cookie for the admin. */
export async function createSession(username: string, tokenVersion: number, autoLogoutMinutes: number) {
  const maxAge = Math.max(5, autoLogoutMinutes) * 60;
  const token = await signSession({ sub: username, tv: tokenVersion }, maxAge);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Full server-side session check — verifies the JWT *and* that its token
 * version still matches the DB (so "regenerate tokens" logs everyone out).
 */
export async function getSession(): Promise<{ username: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload || payload.role !== "admin") return null;

  const settings = await prisma.settings.findUnique({
    where: { id: SETTINGS_ID },
    select: { tokenVersion: true, adminUsername: true },
  });
  if (!settings) return null;
  if (payload.tv !== settings.tokenVersion) return null;
  return { username: settings.adminUsername };
}

export async function isAdmin(): Promise<boolean> {
  return (await getSession()) !== null;
}

/** Guard for API routes — returns the session or throws a 401-carrying error. */
export async function requireAdmin(): Promise<{ username: string }> {
  const session = await getSession();
  if (!session) {
    const err = new Error("Unauthorized") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return session;
}

/** Whether public visitors are allowed to browse (admin always allowed). */
export async function canView(): Promise<boolean> {
  if (await isAdmin()) return true;
  const settings = await getSettings();
  return settings.publicViewing;
}

/** Generate a human-friendly password-reset security code (returns plaintext + stores hash). */
export async function generateResetCode(): Promise<string> {
  const code = Array.from({ length: 3 })
    .map(() => Math.random().toString(36).slice(2, 6).toUpperCase())
    .join("-");
  const resetCodeHash = await bcrypt.hash(code, 10);
  await prisma.settings.update({ where: { id: SETTINGS_ID }, data: { resetCodeHash } });
  return code;
}
