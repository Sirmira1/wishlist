import { handle, ok } from "@/lib/api";
import { getSession, isSetupComplete, getSettings } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const [session, setup, settings] = await Promise.all([
    getSession(),
    isSetupComplete(),
    getSettings(),
  ]);
  return ok({
    isAuthenticated: Boolean(session),
    isAdmin: session?.role === "ADMIN",
    userId: session?.userId ?? null,
    username: session?.username ?? null,
    displayName: session?.displayName ?? null,
    role: session?.role ?? null,
    setupComplete: setup,
    publicViewing: settings.publicViewing,
    allowRegistration: settings.allowRegistration,
    autoLogoutMinutes: settings.autoLogoutMinutes,
  });
});
