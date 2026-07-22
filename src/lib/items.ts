import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { logActivity } from "./activity";
import { uniqueSlug } from "./utils";
import { ACQUIRED_STATUSES, statusMeta } from "./constants";
import type { itemInputSchema } from "./validations";
import type { z } from "zod";

export const itemInclude = {
  category: true,
  collections: { select: { id: true, name: true, slug: true, color: true, icon: true } },
  rooms: { select: { id: true, name: true, slug: true, color: true, icon: true } },
  vehicle: true,
  priceHistory: { orderBy: { recordedAt: "asc" as const } },
  relatedItems: { select: { id: true, title: true, slug: true, imageUrl: true, status: true } },
} satisfies Prisma.ItemInclude;

export type ItemWithRelations = Prisma.ItemGetPayload<{ include: typeof itemInclude }>;

type ParsedInput = z.output<typeof itemInputSchema>;

// Split the flat validated input into scalar item data + relation ops.
function toScalarData(input: ParsedInput) {
  return {
    title: input.title,
    description: input.description ?? null,
    notes: input.notes ?? null,
    brand: input.brand ?? null,
    model: input.model ?? null,
    color: input.color ?? null,
    condition: input.condition ?? null,
    tags: input.tags ?? [],
    subcategory: input.subcategory ?? null,
    priority: input.priority,
    status: input.status,
    store: input.store ?? null,
    vendor: input.vendor ?? null,
    url: input.url ?? null,
    imageUrl: input.imageUrl ?? null,
    gallery: input.gallery ?? [],
    sku: input.sku ?? null,
    msrp: input.msrp ?? null,
    currentPrice: input.currentPrice ?? null,
    discountPrice: input.discountPrice ?? null,
    taxEstimate: input.taxEstimate ?? null,
    shippingEstimate: input.shippingEstimate ?? null,
    quantityDesired: input.quantityDesired ?? 1,
    quantityOwned: input.quantityOwned ?? 0,
    locationType: input.locationType ?? null,
    country: input.country ?? null,
    dateOrdered: input.dateOrdered ?? null,
    dateAcquired: input.dateAcquired ?? null,
    dateArchived: input.dateArchived ?? null,
    serialNumber: input.serialNumber ?? null,
    warrantyUntil: input.warrantyUntil ?? null,
    favorite: input.favorite ?? false,
    pinned: input.pinned ?? false,
    isPcPart: input.isPcPart ?? false,
    pcPartType: input.pcPartType ?? null,
    customFields: (input.customFields ?? []) as unknown as Prisma.InputJsonValue,
  };
}

export async function createItem(input: ParsedInput): Promise<ItemWithRelations> {
  const scalar = toScalarData(input);
  const acquiredNow = ACQUIRED_STATUSES.has(input.status) && !input.dateAcquired;

  const item = await prisma.item.create({
    data: {
      ...scalar,
      slug: uniqueSlug(input.title),
      dateAcquired: acquiredNow ? new Date() : scalar.dateAcquired,
      category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
      collections: input.collectionIds?.length
        ? { connect: input.collectionIds.map((id) => ({ id })) }
        : undefined,
      rooms: input.roomIds?.length ? { connect: input.roomIds.map((id) => ({ id })) } : undefined,
      relatedItems: input.relatedItemIds?.length
        ? { connect: input.relatedItemIds.map((id) => ({ id })) }
        : undefined,
      vehicle: input.vehicle
        ? {
            create: {
              vehicleType: input.vehicle.vehicleType,
              make: input.vehicle.make ?? null,
              model: input.vehicle.model ?? null,
              year: input.vehicle.year ?? null,
              trim: input.vehicle.trim ?? null,
              mileage: input.vehicle.mileage ?? null,
              horsepower: input.vehicle.horsepower ?? null,
              targetPrice: input.vehicle.targetPrice ?? null,
              ownershipCost: input.vehicle.ownershipCost ?? null,
            },
          }
        : undefined,
      priceHistory:
        scalar.currentPrice != null
          ? { create: { price: scalar.currentPrice, source: "initial" } }
          : undefined,
    },
    include: itemInclude,
  });

  await logActivity("ITEM_ADDED", `Added “${item.title}” to the wishlist`, {
    itemId: item.id,
    itemTitle: item.title,
  });
  if (ACQUIRED_STATUSES.has(item.status)) {
    await logActivity("ITEM_ACQUIRED", `Acquired “${item.title}” 🎉`, {
      itemId: item.id,
      itemTitle: item.title,
    });
  }
  return item;
}

export async function updateItem(id: string, input: ParsedInput): Promise<ItemWithRelations> {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Item not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  const scalar = toScalarData(input);

  const statusChanged = existing.status !== input.status;
  const nowAcquired = ACQUIRED_STATUSES.has(input.status) && !ACQUIRED_STATUSES.has(existing.status);
  const priceChanged =
    scalar.currentPrice != null && scalar.currentPrice !== existing.currentPrice;

  const item = await prisma.item.update({
    where: { id },
    data: {
      ...scalar,
      dateAcquired: nowAcquired && !input.dateAcquired ? new Date() : scalar.dateAcquired,
      category: input.categoryId
        ? { connect: { id: input.categoryId } }
        : { disconnect: true },
      collections: { set: (input.collectionIds ?? []).map((cid) => ({ id: cid })) },
      rooms: { set: (input.roomIds ?? []).map((rid) => ({ id: rid })) },
      relatedItems: { set: (input.relatedItemIds ?? []).map((rid) => ({ id: rid })) },
      vehicle: input.vehicle
        ? {
            upsert: {
              create: {
                vehicleType: input.vehicle.vehicleType,
                make: input.vehicle.make ?? null,
                model: input.vehicle.model ?? null,
                year: input.vehicle.year ?? null,
                trim: input.vehicle.trim ?? null,
                mileage: input.vehicle.mileage ?? null,
                horsepower: input.vehicle.horsepower ?? null,
                targetPrice: input.vehicle.targetPrice ?? null,
                ownershipCost: input.vehicle.ownershipCost ?? null,
              },
              update: {
                vehicleType: input.vehicle.vehicleType,
                make: input.vehicle.make ?? null,
                model: input.vehicle.model ?? null,
                year: input.vehicle.year ?? null,
                trim: input.vehicle.trim ?? null,
                mileage: input.vehicle.mileage ?? null,
                horsepower: input.vehicle.horsepower ?? null,
                targetPrice: input.vehicle.targetPrice ?? null,
                ownershipCost: input.vehicle.ownershipCost ?? null,
              },
            },
          }
        : undefined,
      priceHistory: priceChanged
        ? { create: { price: scalar.currentPrice as number, source: "manual" } }
        : undefined,
    },
    include: itemInclude,
  });

  // If the vehicle payload was cleared, drop any existing vehicle record.
  if (!input.vehicle) {
    await prisma.vehicle.deleteMany({ where: { itemId: id } });
  }

  await logActivity("ITEM_UPDATED", `Updated “${item.title}”`, {
    itemId: item.id,
    itemTitle: item.title,
  });
  if (statusChanged) {
    await logActivity("STATUS_CHANGED", `“${item.title}” → ${statusMeta(item.status).label}`, {
      itemId: item.id,
      itemTitle: item.title,
      meta: { from: existing.status, to: item.status },
    });
  }
  if (nowAcquired) {
    await logActivity("ITEM_ACQUIRED", `Acquired “${item.title}” 🎉`, {
      itemId: item.id,
      itemTitle: item.title,
    });
  }
  if (priceChanged) {
    await logActivity("PRICE_UPDATED", `Price of “${item.title}” updated`, {
      itemId: item.id,
      itemTitle: item.title,
      meta: { from: existing.currentPrice, to: scalar.currentPrice },
    });
  }
  return item;
}

/** Safely delete the vehicle relation when the vehicle payload is removed. */
export async function detachVehicleIfNeeded(id: string, hasVehicle: boolean) {
  if (hasVehicle) return;
  await prisma.vehicle.deleteMany({ where: { itemId: id } });
}
