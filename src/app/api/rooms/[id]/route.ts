import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireEdit } from "@/lib/auth";
import { roomSchema } from "@/lib/validations";
import { itemInclude } from "@/lib/items";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const { id } = await params;
  const room = await prisma.room.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { items: { include: itemInclude } },
  });
  if (!room) return fail("Room not found", 404);
  return ok(room);
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const existing = await prisma.room.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return fail("Room not found", 404);
  await requireEdit(existing.userId);
  const data = roomSchema.partial().parse(await req.json());
  const room = await prisma.room.update({
    where: { id },
    data: {
      name: data.name,
      icon: data.icon ?? undefined,
      color: data.color ?? undefined,
      description: data.description ?? undefined,
      imageUrl: data.imageUrl ?? undefined,
      items: data.itemIds ? { set: data.itemIds.map((id) => ({ id })) } : undefined,
    },
  });
  await logActivity("ROOM_UPDATED", `Updated room “${room.name}”`);
  return ok(room);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const existing = await prisma.room.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) return fail("Room not found", 404);
  await requireEdit(existing.userId);
  await prisma.room.delete({ where: { id } });
  return ok({ success: true });
});
