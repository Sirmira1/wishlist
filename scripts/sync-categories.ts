// Sync the expanded category taxonomy into the DB and re-file existing items.
// Idempotent: only creates categories that don't exist and only re-assigns
// items whose best-match category differs from their current one.
import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/constants";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}
function uniqueSlug(s: string) {
  return `${slugify(s) || "category"}-${Math.random().toString(36).slice(2, 6)}`;
}

// First matching rule wins. Order matters (specific before generic).
const RULES: { re: RegExp; category: string }[] = [
  { re: /hot ?wheels/i, category: "Hot Wheels" },
  { re: /cooler|aio|liquid cpu|nautilus/i, category: "CPU Coolers" },
  { re: /graphics card|video card|\brtx\b|\bgtx\b|radeon|geforce|\brx ?\d{3,4}\b/i, category: "Graphics Cards" },
  { re: /motherboard|b650|b550|x670|x570|z790|z690/i, category: "Motherboards" },
  { re: /\bram\b|ddr\d|vengeance|trident|\bmemory\b/i, category: "Memory (RAM)" },
  { re: /\bssd\b|nvme|solid state|\bhdd\b|hard drive|990 pro|p3 plus|m\.2/i, category: "Storage" },
  { re: /power supply|\bpsu\b|rm\d{3}|fully modular/i, category: "Power Supplies" },
  { re: /full tower|mid tower|\bpc case\b|fractal design north/i, category: "PC Cases" },
  { re: /ryzen|\bcpu\b|core i\d|processor|threadripper/i, category: "CPUs" },
  { re: /keyboard|blackwidow|mechanical/i, category: "Keyboards" },
  { re: /\bmouse\b|g502|deathadder/i, category: "Mice" },
  { re: /webcam|brio/i, category: "Webcams" },
  { re: /headphone|hd ?560|hd ?6\d\d/i, category: "Headphones" },
  { re: /headset/i, category: "Headsets" },
  { re: /apple watch|smart ?watch|galaxy watch/i, category: "Smartwatches" },
  { re: /racing sim|sim racing|racing simulator|sim rig/i, category: "Sim Racing" },
  { re: /monitor|odyssey/i, category: "Monitors" },
  { re: /\btv\b|oled tv|television/i, category: "TVs" },
  { re: /mattress/i, category: "Mattresses" },
  { re: /bed frame/i, category: "Bed Frames" },
  { re: /shelf|shelving|alex drawer|\black\b|billy|\bdrawer/i, category: "Storage & Shelving" },
  { re: /desk|adils|countertop/i, category: "Desks" },
  { re: /\bchair\b/i, category: "Chairs" },
  { re: /air purifier|purifier|humidifier|dehumidifier/i, category: "Appliances" },
  { re: /picture|poster|wall art|painting|framed print/i, category: "Wall Art" },
  { re: /\bclock\b/i, category: "Decor" },
  { re: /\blamp\b|lights? for|led strip|lighting/i, category: "Lighting" },
  { re: /\bplant/i, category: "Plants" },
  { re: /clothing|hoodie|\bshirt\b|jacket|\bpants\b/i, category: "Clothing" },
  { re: /\bshoe|sneaker|new balance|jordan|yeezy/i, category: "Shoes" },
  // Specific car models last (never a bare "car" so "Car Picture" isn't caught).
  { re: /corvette|charger|hellcat|redeye|\bcivic\b|mustang|camaro|porsche|\b911\b|\bc6\b/i, category: "Cars" },
];

async function main() {
  // 1. Ensure all categories exist (parents first).
  const existing = await prisma.category.findMany();
  const byName = new Map(existing.map((c) => [c.name.toLowerCase(), c]));

  const parents = DEFAULT_CATEGORIES.filter((c) => !c.parent);
  const children = DEFAULT_CATEGORIES.filter((c) => c.parent);
  let createdCats = 0;

  for (const c of [...parents, ...children]) {
    if (byName.has(c.name.toLowerCase())) continue;
    const parentId = c.parent ? byName.get(c.parent.toLowerCase())?.id ?? null : null;
    const created = await prisma.category.create({
      data: { name: c.name, slug: uniqueSlug(c.name), icon: c.icon, color: c.color, parentId },
    });
    byName.set(created.name.toLowerCase(), created);
    createdCats++;
  }
  console.log(`✓ Categories: ${createdCats} created, ${byName.size} total`);

  // 2. Re-file items.
  const items = await prisma.item.findMany({ include: { category: true } });
  let moved = 0;
  for (const item of items) {
    const rule = RULES.find((r) => r.re.test(item.title));
    if (!rule) continue;
    const target = byName.get(rule.category.toLowerCase());
    if (!target || target.id === item.categoryId) continue;
    await prisma.item.update({ where: { id: item.id }, data: { categoryId: target.id } });
    console.log(`  ${(item.category?.name ?? "—").padEnd(16)} → ${target.name.padEnd(18)} | ${item.title.slice(0, 50)}`);
    moved++;
  }
  console.log(`✓ Re-filed ${moved} item(s)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("DONE ✔");
  })
  .catch(async (e) => {
    console.error("FAILED:", e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
