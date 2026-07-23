import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser, canEdit } from "@/lib/auth";
import { itemInclude } from "@/lib/items";
import { logActivity } from "@/lib/activity";
import { uniqueSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireUser();
  const { id } = await params;
  const src = await prisma.item.findUnique({
    where: { id },
    include: { collections: true, rooms: true, vehicle: true },
  });
  if (!src) return fail("Item not found", 404);

  // The copy is owned by the current user (fork into your own wishlist).
  // Only carry over collections/rooms when duplicating your own item.
  const own = canEdit(session, src.userId);
  const copy = await prisma.item.create({
    data: {
      title: `${src.title} (copy)`,
      slug: uniqueSlug(src.title),
      userId: session.userId,
      description: src.description,
      notes: src.notes,
      brand: src.brand,
      model: src.model,
      color: src.color,
      condition: src.condition,
      tags: src.tags,
      subcategory: src.subcategory,
      priority: src.priority,
      status: src.status,
      store: src.store,
      vendor: src.vendor,
      url: src.url,
      imageUrl: src.imageUrl,
      gallery: src.gallery,
      sku: src.sku,
      msrp: src.msrp,
      currentPrice: src.currentPrice,
      discountPrice: src.discountPrice,
      taxEstimate: src.taxEstimate,
      shippingEstimate: src.shippingEstimate,
      quantityDesired: src.quantityDesired,
      quantityOwned: src.quantityOwned,
      locationType: src.locationType,
      country: src.country,
      isPcPart: src.isPcPart,
      pcPartType: src.pcPartType,
      customFields: src.customFields ?? undefined,
      categoryId: src.categoryId,
      collections: own ? { connect: src.collections.map((c) => ({ id: c.id })) } : undefined,
      rooms: own ? { connect: src.rooms.map((r) => ({ id: r.id })) } : undefined,
    },
    include: itemInclude,
  });

  await logActivity("ITEM_ADDED", `Duplicated “${src.title}”`, {
    itemId: copy.id,
    itemTitle: copy.title,
    userId: session.userId,
  });
  return ok(copy, { status: 201 });
});
