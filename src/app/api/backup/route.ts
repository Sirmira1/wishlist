import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { uniqueSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Full database export (excludes password/secret fields).
export const GET = handle(async () => {
  await requireAdmin();
  const [categories, collections, rooms, items, budgets] = await Promise.all([
    prisma.category.findMany(),
    prisma.collection.findMany(),
    prisma.room.findMany(),
    prisma.item.findMany({
      include: {
        collections: { select: { id: true } },
        rooms: { select: { id: true } },
        vehicle: true,
        priceHistory: true,
      },
    }),
    prisma.budget.findMany(),
  ]);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    collections,
    rooms,
    items,
    budgets,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="life-wishlist-backup-${Date.now()}.json"`,
    },
  });
});

const restoreSchema = z.object({
  version: z.number().optional(),
  categories: z.array(z.any()).optional().default([]),
  collections: z.array(z.any()).optional().default([]),
  rooms: z.array(z.any()).optional().default([]),
  items: z.array(z.any()).optional().default([]),
  budgets: z.array(z.any()).optional().default([]),
  wipe: z.boolean().optional().default(false),
});

// Restore from a backup file. `wipe: true` replaces existing data.
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = restoreSchema.parse(await req.json());

  if (data.wipe) {
    await prisma.priceHistory.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.item.deleteMany();
    await prisma.collection.deleteMany();
    await prisma.room.deleteMany();
    await prisma.category.deleteMany();
  }

  const catIdMap = new Map<string, string>();
  for (const c of data.categories) {
    const created = await prisma.category.create({
      data: {
        name: c.name,
        slug: uniqueSlug(c.name),
        icon: c.icon ?? null,
        color: c.color ?? null,
        description: c.description ?? null,
      },
    });
    catIdMap.set(c.id, created.id);
  }
  // Re-link parents after all created.
  for (const c of data.categories) {
    if (c.parentId && catIdMap.has(c.parentId) && catIdMap.has(c.id)) {
      await prisma.category.update({
        where: { id: catIdMap.get(c.id)! },
        data: { parentId: catIdMap.get(c.parentId) },
      });
    }
  }

  const colIdMap = new Map<string, string>();
  for (const c of data.collections) {
    const created = await prisma.collection.create({
      data: {
        name: c.name,
        slug: uniqueSlug(c.name),
        description: c.description ?? null,
        icon: c.icon ?? null,
        color: c.color ?? null,
        coverImage: c.coverImage ?? null,
        targetBudget: c.targetBudget ?? null,
      },
    });
    colIdMap.set(c.id, created.id);
  }

  const roomIdMap = new Map<string, string>();
  for (const r of data.rooms) {
    const created = await prisma.room.create({
      data: {
        name: r.name,
        slug: uniqueSlug(r.name),
        icon: r.icon ?? null,
        color: r.color ?? null,
        description: r.description ?? null,
        imageUrl: r.imageUrl ?? null,
      },
    });
    roomIdMap.set(r.id, created.id);
  }

  let itemsRestored = 0;
  for (const i of data.items) {
    const collectionIds = (i.collections ?? [])
      .map((c: { id: string }) => colIdMap.get(c.id))
      .filter(Boolean);
    const roomIds = (i.rooms ?? []).map((r: { id: string }) => roomIdMap.get(r.id)).filter(Boolean);
    await prisma.item.create({
      data: {
        title: i.title,
        slug: uniqueSlug(i.title),
        description: i.description ?? null,
        notes: i.notes ?? null,
        brand: i.brand ?? null,
        model: i.model ?? null,
        color: i.color ?? null,
        condition: i.condition ?? null,
        tags: i.tags ?? [],
        subcategory: i.subcategory ?? null,
        priority: i.priority ?? "MEDIUM",
        status: i.status ?? "WISHLISTED",
        store: i.store ?? null,
        vendor: i.vendor ?? null,
        url: i.url ?? null,
        imageUrl: i.imageUrl ?? null,
        gallery: i.gallery ?? [],
        sku: i.sku ?? null,
        msrp: i.msrp ?? null,
        currentPrice: i.currentPrice ?? null,
        discountPrice: i.discountPrice ?? null,
        taxEstimate: i.taxEstimate ?? null,
        shippingEstimate: i.shippingEstimate ?? null,
        quantityDesired: i.quantityDesired ?? 1,
        quantityOwned: i.quantityOwned ?? 0,
        locationType: i.locationType ?? null,
        country: i.country ?? null,
        serialNumber: i.serialNumber ?? null,
        isPcPart: i.isPcPart ?? false,
        pcPartType: i.pcPartType ?? null,
        customFields: i.customFields ?? undefined,
        categoryId: i.categoryId ? catIdMap.get(i.categoryId) ?? null : null,
        collections: collectionIds.length ? { connect: collectionIds.map((id: string) => ({ id })) } : undefined,
        rooms: roomIds.length ? { connect: roomIds.map((id: string) => ({ id })) } : undefined,
        vehicle: i.vehicle
          ? {
              create: {
                vehicleType: i.vehicle.vehicleType ?? "CAR",
                make: i.vehicle.make ?? null,
                model: i.vehicle.model ?? null,
                year: i.vehicle.year ?? null,
                trim: i.vehicle.trim ?? null,
                mileage: i.vehicle.mileage ?? null,
                horsepower: i.vehicle.horsepower ?? null,
                targetPrice: i.vehicle.targetPrice ?? null,
                ownershipCost: i.vehicle.ownershipCost ?? null,
              },
            }
          : undefined,
      },
    });
    itemsRestored++;
  }

  return ok({ success: true, itemsRestored });
});
