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
    isAdmin: Boolean(session),
    username: session?.username ?? null,
    setupComplete: setup,
    publicViewing: settings.publicViewing,
    autoLogoutMinutes: settings.autoLogoutMinutes,
  });
});
