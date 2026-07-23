import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { meSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      monthlyBudget: true,
      yearlyBudget: true,
      savingsGoal: true,
      savingsCurrent: true,
      resetCodeHash: true,
      createdAt: true,
    },
  });
  return ok({ ...user, hasResetCode: Boolean(user?.resetCodeHash), resetCodeHash: undefined });
});

export const PATCH = handle(async (req: Request) => {
  const session = await requireUser();
  const data = meSchema.parse(await req.json());

  // Guard username uniqueness when changing it.
  if (data.username && data.username !== session.username) {
    const taken = await prisma.user.findUnique({ where: { username: data.username } });
    if (taken) return fail("That username is taken.", 409);
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      username: data.username ?? undefined,
      displayName: data.displayName ?? undefined,
      monthlyBudget: data.monthlyBudget ?? undefined,
      yearlyBudget: data.yearlyBudget ?? undefined,
      savingsGoal: data.savingsGoal ?? undefined,
      savingsCurrent: data.savingsCurrent ?? undefined,
    },
    select: { id: true, username: true, displayName: true, monthlyBudget: true, yearlyBudget: true, savingsGoal: true },
  });
  return ok(user);
});
