import { z } from "zod";
import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireEdit } from "@/lib/auth";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  amount: z.coerce.number().min(0).optional(),
  period: z.enum(["MONTHLY", "YEARLY", "TOTAL"]).optional(),
});

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const existing = await prisma.budget.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return fail("Budget not found", 404);
  await requireEdit(existing.userId);
  const data = patchSchema.parse(await req.json());
  const budget = await prisma.budget.update({ where: { id }, data });
  return ok(budget);
});

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const existing = await prisma.budget.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return fail("Budget not found", 404);
  await requireEdit(existing.userId);
  await prisma.budget.delete({ where: { id } });
  return ok({ success: true });
});
