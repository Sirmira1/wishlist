import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getSettings, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Regenerate session tokens: invalidate every session, keep the current admin signed in.
export const POST = handle(async () => {
  await requireAdmin();
  const settings = await getSettings();
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { tokenVersion: { increment: 1 } },
  });
  await createSession(updated.adminUsername, updated.tokenVersion, updated.autoLogoutMinutes);
  return ok({ success: true, tokenVersion: updated.tokenVersion });
});
