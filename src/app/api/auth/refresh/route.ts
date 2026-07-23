import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Sliding session: re-issue the cookie for another full window while active.
export const POST = handle(async () => {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, tokenVersion: true, role: true },
  });
  if (!user) return fail("User not found.", 404);
  await createSession(user);
  return ok({ success: true });
});
