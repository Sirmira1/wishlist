import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireUser, resolveWishlistOwner } from "@/lib/auth";
import { collectionSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { uniqueSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const ownerId = await resolveWishlistOwner(new URL(req.url).searchParams.get("userId"));
  const collections = await prisma.collection.findMany({
    where: ownerId ? { userId: ownerId } : {},
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true, children: true } },
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
          imageUrl: true,
        },
      },
    },
  });
  return ok(collections);
});

export const POST = handle(async (req: Request) => {
  const session = await requireUser();
  const data = collectionSchema.parse(await req.json());
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      slug: uniqueSlug(data.name),
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      coverImage: data.coverImage ?? null,
      targetBudget: data.targetBudget ?? null,
      parentId: data.parentId ?? null,
      userId: session.userId,
      items: data.itemIds?.length ? { connect: data.itemIds.map((id) => ({ id })) } : undefined,
    },
  });
  await logActivity("COLLECTION_CREATED", `Created collection “${collection.name}”`, {
    userId: session.userId,
  });
  return ok(collection, { status: 201 });
});
