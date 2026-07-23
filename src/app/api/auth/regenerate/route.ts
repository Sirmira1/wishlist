import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Regenerate session tokens: invalidate this account's other sessions, keep this one.
export const POST = handle(async () => {
  const session = await requireUser();
  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { tokenVersion: { increment: 1 } },
    select: { id: true, tokenVersion: true, role: true },
  });
  if (!user) return fail("User not found.", 404);
  await createSession(user);
  return ok({ success: true });
});
