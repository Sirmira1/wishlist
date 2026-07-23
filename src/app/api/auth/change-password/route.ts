import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser, verifyPassword, hashPassword, createSession } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: Request) => {
  const session = await requireUser();
  const { currentPassword, newPassword } = changePasswordSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return fail("User not found.", 404);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return fail("Current password is incorrect.", 401);
  }

  const passwordHash = await hashPassword(newPassword);
  // Bump tokenVersion to sign out other sessions, then refresh this one.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
  await createSession(updated);

  return ok({ success: true });
});
