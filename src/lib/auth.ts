import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "./prisma";
import { SESSION_COOKIE, signSession, verifySessionToken, type Role } from "./jwt";

const SETTINGS_ID = "singleton";

export type SessionUser = {
  userId: string;
  username: string;
  displayName: string | null;
  role: Role;
};

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

/** Setup is complete once at least one ADMIN user exists. */
export async function isSetupComplete(): Promise<boolean> {
  const count = await prisma.user.count({ where: { role: "ADMIN" } });
  return count > 0;
}

/** The primary admin (used as the default public wishlist owner). */
export async function getAdminUser() {
  return prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
}

/** Issue a signed session cookie for a user. */
export async function createSession(user: Pick<User, "id" | "tokenVersion" | "role">) {
  const settings = await getSettings();
  const maxAge = Math.max(5, settings.autoLogoutMinutes) * 60;
  const token = await signSession(
    { sub: user.id, tv: user.tokenVersion, role: user.role as Role },
    maxAge
  );
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
 * Verify the session JWT *and* that its token version still matches the DB
 * (so password changes / "regenerate tokens" invalidate old sessions).
 */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, displayName: true, role: true, tokenVersion: true },
  });
  if (!user) return null;
  if (payload.tv !== user.tokenVersion) return null;
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role as Role,
  };
}

export async function isAdmin(): Promise<boolean> {
  return (await getSession())?.role === "ADMIN";
}

/** Any authenticated user, or throw 401. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    const err = new Error("Unauthorized") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  return session;
}

/** Admin only, or throw. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    const err = new Error("Unauthorized") as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  if (session.role !== "ADMIN") {
    const err = new Error("Forbidden") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  return session;
}

/** Whether the current session may edit a resource owned by `ownerId`. */
export function canEdit(session: SessionUser | null, ownerId: string | null | undefined): boolean {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  return Boolean(ownerId) && session.userId === ownerId;
}

/** Require edit permission on a resource, or throw 403/401. */
export async function requireEdit(ownerId: string | null | undefined): Promise<SessionUser> {
  const session = await requireUser();
  if (!canEdit(session, ownerId)) {
    const err = new Error("Forbidden") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  return session;
}

/**
 * Which wishlist owner a list/stats request should scope to:
 * explicit ?userId → that user; else the logged-in user's own; else the admin
 * (so anonymous visitors land on the admin's wishlist by default).
 */
export async function resolveWishlistOwner(explicit?: string | null): Promise<string | null> {
  if (explicit) return explicit;
  const session = await getSession();
  if (session) return session.userId;
  return (await getAdminUser())?.id ?? null;
}

/** Anyone may view when public viewing is on, or when logged in. */
export async function canView(): Promise<boolean> {
  if (await getSession()) return true;
  const settings = await getSettings();
  return settings.publicViewing;
}

/** Generate a recovery code for a user (returns plaintext once, stores hash). */
export async function generateResetCode(userId: string): Promise<string> {
  const code = Array.from({ length: 3 })
    .map(() => Math.random().toString(36).slice(2, 6).toUpperCase())
    .join("-");
  const resetCodeHash = await bcrypt.hash(code, 10);
  await prisma.user.update({ where: { id: userId }, data: { resetCodeHash } });
  return code;
}
