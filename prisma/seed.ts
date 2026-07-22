import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Keep in sync with src/lib/constants.ts (subset) — seed cannot import app aliases easily.
const DEFAULT_CATEGORIES = [
  { name: "PC Parts", icon: "Cpu", color: "#6366f1" },
  { name: "Entire PC Builds", icon: "Server", color: "#6366f1" },
  { name: "Furniture", icon: "Sofa", color: "#f59e0b" },
  { name: "Technology", icon: "Laptop", color: "#3b82f6" },
  { name: "Monitors", icon: "Monitor", color: "#3b82f6" },
  { name: "Audio", icon: "Headphones", color: "#8b5cf6" },
  { name: "Gaming", icon: "Gamepad2", color: "#22c55e" },
  { name: "Vehicles", icon: "Car", color: "#ef4444" },
  { name: "Watches", icon: "Watch", color: "#64748b" },
  { name: "Lego", icon: "ToyBrick", color: "#eab308" },
  { name: "Books", icon: "BookOpen", color: "#0891b2" },
  { name: "Travel", icon: "Plane", color: "#0ea5e9" },
];

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}
function uniqueSlug(input: string) {
  return `${slugify(input) || "item"}-${Math.random().toString(36).slice(2, 7)}`;
}

async function main() {
  // 1. Settings singleton + optional admin credentials.
  const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const passwordHash = adminPassword ? await bcrypt.hash(adminPassword, 12) : undefined;

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: passwordHash ? { adminUsername, passwordHash } : {},
    create: {
      id: "singleton",
      adminUsername,
      passwordHash,
      monthlyBudget: 500,
      yearlyBudget: 6000,
    },
  });
  console.log(passwordHash ? `✓ Admin ready (${adminUsername})` : "✓ Settings created (complete setup at /setup)");

  // 2. Categories.
  const catCount = await prisma.category.count();
  const catByName = new Map<string, string>();
  if (catCount === 0) {
    for (const c of DEFAULT_CATEGORIES) {
      const created = await prisma.category.create({
        data: { name: c.name, slug: slugify(c.name), icon: c.icon, color: c.color },
      });
      catByName.set(c.name, created.id);
    }
    console.log(`✓ Seeded ${DEFAULT_CATEGORIES.length} categories`);
  } else {
    (await prisma.category.findMany()).forEach((c) => catByName.set(c.name, c.id));
  }

  // 3. Sample content (only if empty).
  if ((await prisma.item.count()) > 0) {
    console.log("• Items already exist — skipping sample data");
    return;
  }

  const collection = await prisma.collection.create({
    data: { name: "Dream Gaming Setup", slug: uniqueSlug("Dream Gaming Setup"), description: "The ultimate battlestation.", color: "#8b5cf6" },
  });
  const room = await prisma.room.create({
    data: { name: "Gaming Room", slug: uniqueSlug("Gaming Room"), description: "Where it all comes together.", color: "#22c55e" },
  });

  const samples = [
    { title: "NVIDIA RTX 5090 Founders Edition", category: "PC Parts", brand: "NVIDIA", msrp: 1999, currentPrice: 1999, priority: "VERY_HIGH", status: "SAVING_FOR", isPcPart: true, pcPartType: "GPU", tags: ["gpu", "4k"], imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800" },
    { title: "AMD Ryzen 9 9950X", category: "PC Parts", brand: "AMD", msrp: 649, currentPrice: 599, discountPrice: 559, priority: "HIGH", status: "READY_TO_BUY", isPcPart: true, pcPartType: "CPU", tags: ["cpu"], imageUrl: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800" },
    { title: "LG 45\" OLED Ultrawide", category: "Monitors", brand: "LG", msrp: 1699, currentPrice: 1499, priority: "HIGH", status: "WISHLISTED", tags: ["oled", "ultrawide"], imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800" },
    { title: "Herman Miller Embody Chair", category: "Furniture", brand: "Herman Miller", msrp: 1795, currentPrice: 1795, priority: "MEDIUM", status: "PLANNING", tags: ["ergonomic"], imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800" },
    { title: "Sony WH-1000XM5", category: "Audio", brand: "Sony", msrp: 399, currentPrice: 329, discountPrice: 299, priority: "MEDIUM", status: "ACQUIRED", tags: ["anc"], imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800" },
    { title: "LEGO Millennium Falcon UCS", category: "Lego", brand: "LEGO", msrp: 849, currentPrice: 849, priority: "SOMEDAY", status: "DREAM", tags: ["star wars", "ucs"], imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800" },
    { title: "Porsche 911 GT3", category: "Vehicles", brand: "Porsche", msrp: 182000, currentPrice: 182000, priority: "SOMEDAY", status: "DREAM", tags: ["dream car"], imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800" },
    { title: "Trip to Japan", category: "Travel", msrp: 6000, currentPrice: 6000, priority: "HIGH", status: "SAVING_FOR", tags: ["travel", "experience"], imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800" },
  ];

  for (const s of samples) {
    const item = await prisma.item.create({
      data: {
        title: s.title,
        slug: uniqueSlug(s.title),
        brand: s.brand,
        categoryId: catByName.get(s.category),
        msrp: s.msrp,
        currentPrice: s.currentPrice,
        discountPrice: (s as any).discountPrice,
        priority: s.priority,
        status: s.status,
        isPcPart: (s as any).isPcPart ?? false,
        pcPartType: (s as any).pcPartType,
        tags: s.tags,
        imageUrl: s.imageUrl,
        taxEstimate: s.currentPrice ? Math.round(s.currentPrice * 0.08) : null,
        dateAcquired: s.status === "ACQUIRED" ? new Date() : null,
        collections: ["GPU", "CPU"].includes((s as any).pcPartType) || s.category === "Monitors" || s.category === "Audio"
          ? { connect: { id: collection.id } }
          : undefined,
        rooms: s.category === "PC Parts" || s.category === "Monitors" ? { connect: { id: room.id } } : undefined,
        priceHistory: s.currentPrice ? { create: { price: s.currentPrice, source: "seed" } } : undefined,
      },
    });
    await prisma.activity.create({
      data: { type: "ITEM_ADDED", message: `Added “${item.title}” to the wishlist`, itemId: item.id, itemTitle: item.title },
    });
  }
  console.log(`✓ Seeded ${samples.length} sample items, 1 collection, 1 room`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
