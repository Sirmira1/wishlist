import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isAdmin, getSettings, requireAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const settings = await getSettings();
  const admin = await isAdmin();
  // App-wide, non-secret config. Safe for anyone to read.
  const publicView = {
    theme: settings.theme,
    accentColor: settings.accentColor,
    currency: settings.currency,
    publicViewing: settings.publicViewing,
    allowRegistration: settings.allowRegistration,
  };
  if (!admin) return ok(publicView);
  return ok({
    ...publicView,
    adminUsername: settings.adminUsername,
    autoLogoutMinutes: settings.autoLogoutMinutes,
    isAdmin: true,
  });
});

export const PATCH = handle(async (req: Request) => {
  await requireAdmin();
  const data = settingsSchema.parse(await req.json());
  const current = await getSettings();
  const updated = await prisma.settings.update({
    where: { id: current.id },
    data: {
      publicViewing: data.publicViewing ?? undefined,
      allowRegistration: data.allowRegistration ?? undefined,
      autoLogoutMinutes: data.autoLogoutMinutes ?? undefined,
      theme: data.theme ?? undefined,
      accentColor: data.accentColor ?? undefined,
      currency: data.currency ?? undefined,
    },
  });
  await logActivity("SETTINGS_UPDATED", "Updated settings");
  return ok({ success: true, settings: { theme: updated.theme, accentColor: updated.accentColor } });
});
