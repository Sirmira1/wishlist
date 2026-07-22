import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireAdmin } from "@/lib/auth";
import { budgetSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const budgets = await prisma.budget.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, collection: true },
  });
  return ok(budgets);
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = budgetSchema.parse(await req.json());
  const budget = await prisma.budget.create({
    data: {
      name: data.name,
      scope: data.scope,
      period: data.period,
      amount: data.amount,
      categoryId: data.scope === "CATEGORY" ? data.categoryId ?? null : null,
      collectionId: data.scope === "COLLECTION" ? data.collectionId ?? null : null,
    },
  });
  await logActivity("BUDGET_UPDATED", `Created budget “${budget.name}”`);
  return ok(budget, { status: 201 });
});
