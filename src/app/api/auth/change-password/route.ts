import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  getSettings,
  verifyPassword,
  hashPassword,
  createSession,
} from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const { currentPassword, newPassword } = changePasswordSchema.parse(await req.json());

  const settings = await getSettings();
  if (!settings.passwordHash) return fail("Setup not complete.", 409);
  if (!(await verifyPassword(currentPassword, settings.passwordHash))) {
    return fail("Current password is incorrect.", 401);
  }

  const passwordHash = await hashPassword(newPassword);
  // Bump tokenVersion to log out any other sessions, then refresh this one.
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
  await createSession(updated.adminUsername, updated.tokenVersion, updated.autoLogoutMinutes);

  return ok({ success: true });
});
