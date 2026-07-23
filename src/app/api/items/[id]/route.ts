import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireEdit } from "@/lib/auth";
import { itemInclude, updateItem } from "@/lib/items";
import { logActivity } from "@/lib/activity";
import { itemInputSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const { id } = await params;
  const item = await prisma.item.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: itemInclude,
  });
  if (!item) return fail("Item not found", 404);
  return ok(item);
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const existing = await prisma.item.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return fail("Item not found", 404);
  await requireEdit(existing.userId);
  const input = itemInputSchema.parse(await req.json());
  const item = await updateItem(id, input);
  return ok(item);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return fail("Item not found", 404);
  await requireEdit(item.userId);
  await prisma.item.delete({ where: { id } });
  await logActivity("ITEM_DELETED", `Deleted “${item.title}”`, {
    itemTitle: item.title,
    userId: item.userId ?? undefined,
  });
  return ok({ success: true });
});
