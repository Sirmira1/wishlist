import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  amount: z.coerce.number().min(0).optional(),
  period: z.enum(["MONTHLY", "YEARLY", "TOTAL"]).optional(),
});

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const data = patchSchema.parse(await req.json());
  const budget = await prisma.budget.update({ where: { id }, data });
  return ok(budget);
});

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  await prisma.budget.delete({ where: { id } });
  return ok({ success: true });
});
