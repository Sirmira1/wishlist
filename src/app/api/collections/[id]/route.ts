import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireAdmin } from "@/lib/auth";
import { collectionSchema } from "@/lib/validations";
import { itemInclude } from "@/lib/items";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const { id } = await params;
  const collection = await prisma.collection.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      items: { include: itemInclude },
      children: { include: { _count: { select: { items: true } } } },
      parent: true,
    },
  });
  if (!collection) return fail("Collection not found", 404);
  return ok(collection);
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const data = collectionSchema.partial().parse(await req.json());
  const collection = await prisma.collection.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? undefined,
      icon: data.icon ?? undefined,
      color: data.color ?? undefined,
      coverImage: data.coverImage ?? undefined,
      targetBudget: data.targetBudget ?? undefined,
      parentId: data.parentId ?? undefined,
      items: data.itemIds ? { set: data.itemIds.map((id) => ({ id })) } : undefined,
    },
  });
  await logActivity("COLLECTION_UPDATED", `Updated collection “${collection.name}”`);
  return ok(collection);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await prisma.collection.delete({ where: { id } });
  return ok({ success: true });
});
