import { PrismaClient } from "@prisma/client";

const SOURCE_URL = "postgresql://postgres:postgres@localhost:5432/wishlist?schema=public";
const DEMO_TITLES = new Set([
  "NVIDIA RTX 5090 Founders Edition",
  "AMD Ryzen 9 9950X",
  "LG 45\" OLED Ultrawide",
  "Herman Miller Embody Chair",
  "Sony WH-1000XM5",
  "LEGO Millennium Falcon UCS",
  "Porsche 911 GT3",
  "Trip to Japan",
]);

const source = new PrismaClient({
  datasources: { db: { url: SOURCE_URL } },
});
const target = new PrismaClient();

async function main() {
  const categories = await source.category.findMany();
  const rooms = await source.room.findMany();
  const collections = await source.collection.findMany();
  const items = await source.item.findMany({
    where: {
      NOT: { title: { in: Array.from(DEMO_TITLES) } },
    },
    include: {
      category: true,
      collections: true,
      rooms: true,
      vehicle: true,
      priceHistory: true,
      relatedItems: true,
    },
  });

  const categoryMap = new Map<string, string>();
  const rootCategories = categories.filter((c) => !c.parentId);
  const childCategories = categories.filter((c) => c.parentId);

  for (const c of rootCategories) {
    const existing = await target.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        icon: c.icon,
        color: c.color,
        description: c.description,
        parentId: null,
      },
      create: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        color: c.color,
        description: c.description,
        parentId: null,
      },
    });
    categoryMap.set(c.id, existing.id);
  }

  for (const c of childCategories) {
    const parentId = c.parentId ? categoryMap.get(c.parentId) : null;
    const existing = await target.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        icon: c.icon,
        color: c.color,
        description: c.description,
        parentId,
      },
      create: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        color: c.color,
        description: c.description,
        parentId,
      },
    });
    categoryMap.set(c.id, existing.id);
  }

  const roomMap = new Map<string, string>();
  for (const room of rooms) {
    const existing = await target.room.upsert({
      where: { slug: room.slug },
      update: {
        name: room.name,
        icon: room.icon,
        color: room.color,
        description: room.description,
        imageUrl: room.imageUrl,
      },
      create: {
        name: room.name,
        slug: room.slug,
        icon: room.icon,
        color: room.color,
        description: room.description,
        imageUrl: room.imageUrl,
      },
    });
    roomMap.set(room.id, existing.id);
  }

  const collectionMap = new Map<string, string>();
  const rootCollections = collections.filter((collection) => !collection.parentId);
  const childCollections = collections.filter((collection) => collection.parentId);

  for (const collection of rootCollections) {
    const existing = await target.collection.upsert({
      where: { slug: collection.slug },
      update: {
        name: collection.name,
        icon: collection.icon,
        color: collection.color,
        description: collection.description,
        coverImage: collection.coverImage,
        targetBudget: collection.targetBudget,
        parentId: null,
      },
      create: {
        name: collection.name,
        slug: collection.slug,
        icon: collection.icon,
        color: collection.color,
        description: collection.description,
        coverImage: collection.coverImage,
        targetBudget: collection.targetBudget,
        parentId: null,
      },
    });
    collectionMap.set(collection.id, existing.id);
  }

  for (const collection of childCollections) {
    const parentId = collection.parentId ? collectionMap.get(collection.parentId) : null;
    const existing = await target.collection.upsert({
      where: { slug: collection.slug },
      update: {
        name: collection.name,
        icon: collection.icon,
        color: collection.color,
        description: collection.description,
        coverImage: collection.coverImage,
        targetBudget: collection.targetBudget,
        parentId,
      },
      create: {
        name: collection.name,
        slug: collection.slug,
        icon: collection.icon,
        color: collection.color,
        description: collection.description,
        coverImage: collection.coverImage,
        targetBudget: collection.targetBudget,
        parentId,
      },
    });
    collectionMap.set(collection.id, existing.id);
  }

  let imported = 0;
  for (const item of items) {
    const data = {
      title: item.title,
      slug: item.slug,
      description: item.description,
      notes: item.notes,
      brand: item.brand,
      model: item.model,
      color: item.color,
      condition: item.condition,
      tags: item.tags,
      subcategory: item.subcategory,
      priority: item.priority,
      status: item.status,
      store: item.store,
      vendor: item.vendor,
      url: item.url,
      imageUrl: item.imageUrl,
      gallery: item.gallery,
      sku: item.sku,
      msrp: item.msrp,
      currentPrice: item.currentPrice,
      discountPrice: item.discountPrice,
      taxEstimate: item.taxEstimate,
      shippingEstimate: item.shippingEstimate,
      quantityDesired: item.quantityDesired,
      quantityOwned: item.quantityOwned,
      locationType: item.locationType,
      country: item.country,
      dateOrdered: item.dateOrdered,
      dateAcquired: item.dateAcquired,
      dateArchived: item.dateArchived,
      serialNumber: item.serialNumber,
      warrantyUntil: item.warrantyUntil,
      favorite: item.favorite,
      pinned: item.pinned,
      isPcPart: item.isPcPart,
      pcPartType: item.pcPartType,
      customFields: item.customFields,
      categoryId: item.categoryId ? categoryMap.get(item.categoryId) : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    const createdItem = await target.item.upsert({
      where: { slug: item.slug },
      update: data,
      create: data,
    });

    if (item.categoryId) {
      await target.item.update({
        where: { id: createdItem.id },
        data: { categoryId: categoryMap.get(item.categoryId) ?? null },
      });
    }

    if (item.collections.length > 0) {
      await target.item.update({
        where: { id: createdItem.id },
        data: {
          collections: { set: item.collections.map((c) => ({ id: collectionMap.get(c.id) ?? c.id })) },
        },
      });
    }

    if (item.rooms.length > 0) {
      await target.item.update({
        where: { id: createdItem.id },
        data: {
          rooms: { set: item.rooms.map((r) => ({ id: roomMap.get(r.id) ?? r.id })) },
        },
      });
    }

    if (item.vehicle) {
      await target.vehicle.upsert({
        where: { itemId: createdItem.id },
        update: {
          vehicleType: item.vehicle.vehicleType,
          make: item.vehicle.make,
          model: item.vehicle.model,
          year: item.vehicle.year,
          trim: item.vehicle.trim,
          mileage: item.vehicle.mileage,
          horsepower: item.vehicle.horsepower,
          targetPrice: item.vehicle.targetPrice,
          ownershipCost: item.vehicle.ownershipCost,
        },
        create: {
          itemId: createdItem.id,
          vehicleType: item.vehicle.vehicleType,
          make: item.vehicle.make,
          model: item.vehicle.model,
          year: item.vehicle.year,
          trim: item.vehicle.trim,
          mileage: item.vehicle.mileage,
          horsepower: item.vehicle.horsepower,
          targetPrice: item.vehicle.targetPrice,
          ownershipCost: item.vehicle.ownershipCost,
        },
      });
    }

    if (item.priceHistory.length > 0) {
      await target.priceHistory.createMany({
        data: item.priceHistory.map((history) => ({
          itemId: createdItem.id,
          price: history.price,
          source: history.source,
          note: history.note,
          recordedAt: history.recordedAt,
        })),
      });
    }

    imported++;
  }

  console.log(JSON.stringify({ importedItems: imported }, null, 2));
}

main()
  .then(async () => {
    await source.$disconnect();
    await target.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await source.$disconnect();
    await target.$disconnect();
    process.exit(1);
  });
