import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireUser, resolveWishlistOwner } from "@/lib/auth";
import { budgetSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const ownerId = await resolveWishlistOwner(new URL(req.url).searchParams.get("userId"));
  const budgets = await prisma.budget.findMany({
    where: ownerId ? { userId: ownerId } : {},
    orderBy: { createdAt: "desc" },
    include: { category: true, collection: true },
  });
  return ok(budgets);
});

export const POST = handle(async (req: Request) => {
  const session = await requireUser();
  const data = budgetSchema.parse(await req.json());
  const budget = await prisma.budget.create({
    data: {
      name: data.name,
      scope: data.scope,
      period: data.period,
      amount: data.amount,
      userId: session.userId,
      categoryId: data.scope === "CATEGORY" ? data.categoryId ?? null : null,
      collectionId: data.scope === "COLLECTION" ? data.collectionId ?? null : null,
    },
  });
  await logActivity("BUDGET_UPDATED", `Created budget “${budget.name}”`, { userId: session.userId });
  return ok(budget, { status: 201 });
});
