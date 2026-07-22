import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireAdmin } from "@/lib/auth";
import { roomSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { uniqueSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        select: {
          id: true,
          status: true,
          msrp: true,
          currentPrice: true,
          discountPrice: true,
          taxEstimate: true,
          shippingEstimate: true,
          quantityDesired: true,
        },
      },
    },
  });
  return ok(rooms);
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = roomSchema.parse(await req.json());
  const room = await prisma.room.create({
    data: {
      name: data.name,
      slug: uniqueSlug(data.name),
      icon: data.icon ?? null,
      color: data.color ?? null,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      items: data.itemIds?.length ? { connect: data.itemIds.map((id) => ({ id })) } : undefined,
    },
  });
  await logActivity("ROOM_CREATED", `Created room “${room.name}”`);
  return ok(room, { status: 201 });
});
