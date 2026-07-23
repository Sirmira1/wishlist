import { handle, ok } from "@/lib/api";
import { requireAdmin, getSettings, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Sliding session: re-issue the cookie for another full window while the admin
// is active. requireAdmin() validates the current cookie (incl. token version).
export const POST = handle(async () => {
  await requireAdmin();
  const settings = await getSettings();
  await createSession(settings.adminUsername, settings.tokenVersion, settings.autoLogoutMinutes);
  return ok({ success: true });
});
