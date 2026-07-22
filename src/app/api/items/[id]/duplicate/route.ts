import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { itemInclude } from "@/lib/items";
import { logActivity } from "@/lib/activity";
import { uniqueSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const src = await prisma.item.findUnique({
    where: { id },
    include: { collections: true, rooms: true, vehicle: true },
  });
  if (!src) return fail("Item not found", 404);

  const copy = await prisma.item.create({
    data: {
      title: `${src.title} (copy)`,
      slug: uniqueSlug(src.title),
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
      collections: { connect: src.collections.map((c) => ({ id: c.id })) },
      rooms: { connect: src.rooms.map((r) => ({ id: r.id })) },
    },
    include: itemInclude,
  });

  await logActivity("ITEM_ADDED", `Duplicated “${src.title}”`, {
    itemId: copy.id,
    itemTitle: copy.title,
  });
  return ok(copy, { status: 201 });
});
