import { prisma } from "./prisma";
import { effectivePrice, totalItemCost, potentialSavings } from "./utils";
import {
  ACQUIRED_STATUSES,
  CLOSED_STATUSES,
  STATUSES,
  PRIORITIES,
  statusMeta,
  priorityMeta,
} from "./constants";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type Stats = Awaited<ReturnType<typeof computeStats>>;

export async function computeStats() {
  const [items, collectionsCount, roomsCount, categoriesCount, budgets, settings] =
    await Promise.all([
      prisma.item.findMany({
        include: {
          category: { select: { id: true, name: true, color: true } },
          collections: { select: { id: true, name: true, color: true } },
          rooms: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.collection.count(),
      prisma.room.count(),
      prisma.category.count(),
      prisma.budget.findMany(),
      prisma.settings.findUnique({ where: { id: "singleton" } }),
    ]);

  const active = items.filter((i) => !CLOSED_STATUSES.has(i.status));
  const acquired = items.filter((i) => ACQUIRED_STATUSES.has(i.status));
  const remaining = active.filter((i) => !ACQUIRED_STATUSES.has(i.status));

  const totalValue = active.reduce((s, i) => s + totalItemCost(i), 0);
  const totalSpent = acquired.reduce((s, i) => s + totalItemCost(i), 0);
  const wishlistValue = remaining.reduce((s, i) => s + totalItemCost(i), 0);
  const totalSavings = items.reduce((s, i) => s + potentialSavings(i) * (i.quantityDesired || 1), 0);

  const priced = items.filter((i) => effectivePrice(i) > 0);
  const avgPrice = priced.length
    ? priced.reduce((s, i) => s + effectivePrice(i), 0) / priced.length
    : 0;

  // --- Category breakdown ---
  const catMap = new Map<string, { name: string; color: string; value: number; count: number }>();
  for (const i of active) {
    const key = i.category?.id ?? "uncat";
    const name = i.category?.name ?? "Uncategorized";
    const color = i.category?.color ?? "#94a3b8";
    const cur = catMap.get(key) ?? { name, color, value: 0, count: 0 };
    cur.value += totalItemCost(i);
    cur.count += 1;
    catMap.set(key, cur);
  }
  const byCategory = [...catMap.values()].sort((a, b) => b.value - a.value);

  // --- Status breakdown ---
  const byStatus = STATUSES.map((s) => {
    const group = items.filter((i) => i.status === s.value);
    return {
      status: s.value,
      label: s.label,
      color: s.color,
      count: group.length,
      value: group.reduce((sum, i) => sum + totalItemCost(i), 0),
    };
  }).filter((s) => s.count > 0);

  // --- Priority breakdown ---
  const byPriority = PRIORITIES.map((p) => {
    const group = active.filter((i) => i.priority === p.value);
    return {
      priority: p.value,
      label: p.label,
      color: p.color,
      count: group.length,
      value: group.reduce((sum, i) => sum + totalItemCost(i), 0),
    };
  }).filter((p) => p.count > 0);

  // --- Room breakdown ---
  const roomMap = new Map<string, { name: string; color: string; total: number; acquired: number; value: number }>();
  for (const i of items) {
    for (const r of i.rooms) {
      const cur = roomMap.get(r.id) ?? { name: r.name, color: r.color ?? "#94a3b8", total: 0, acquired: 0, value: 0 };
      cur.total += 1;
      cur.value += totalItemCost(i);
      if (ACQUIRED_STATUSES.has(i.status)) cur.acquired += 1;
      roomMap.set(r.id, cur);
    }
  }
  const byRoom = [...roomMap.values()].sort((a, b) => b.value - a.value);

  // --- Collection breakdown ---
  const colMap = new Map<string, { name: string; color: string; total: number; acquired: number; value: number }>();
  for (const i of items) {
    for (const c of i.collections) {
      const cur = colMap.get(c.id) ?? { name: c.name, color: c.color ?? "#94a3b8", total: 0, acquired: 0, value: 0 };
      cur.total += 1;
      cur.value += totalItemCost(i);
      if (ACQUIRED_STATUSES.has(i.status)) cur.acquired += 1;
      colMap.set(c.id, cur);
    }
  }
  const byCollection = [...colMap.values()].sort((a, b) => b.value - a.value);

  // --- Price distribution buckets ---
  const buckets = [
    { label: "$0–50", min: 0, max: 50 },
    { label: "$50–150", min: 50, max: 150 },
    { label: "$150–500", min: 150, max: 500 },
    { label: "$500–1k", min: 500, max: 1000 },
    { label: "$1k–5k", min: 1000, max: 5000 },
    { label: "$5k+", min: 5000, max: Infinity },
  ];
  const priceDistribution = buckets.map((b) => ({
    label: b.label,
    count: priced.filter((i) => effectivePrice(i) >= b.min && effectivePrice(i) < b.max).length,
  }));

  // --- Growth over time (cumulative items added) + acquisitions ---
  const addedByMonth = new Map<string, number>();
  const acqByMonth = new Map<string, number>();
  const spendByMonth = new Map<string, number>();
  for (const i of items) {
    addedByMonth.set(monthKey(i.createdAt), (addedByMonth.get(monthKey(i.createdAt)) ?? 0) + 1);
    if (i.dateAcquired) {
      const k = monthKey(i.dateAcquired);
      acqByMonth.set(k, (acqByMonth.get(k) ?? 0) + 1);
      spendByMonth.set(k, (spendByMonth.get(k) ?? 0) + totalItemCost(i));
    }
  }
  const allMonths = [...new Set([...addedByMonth.keys(), ...acqByMonth.keys(), ...spendByMonth.keys()])].sort();
  let cumulative = 0;
  const growthOverTime = allMonths.map((m) => {
    cumulative += addedByMonth.get(m) ?? 0;
    return {
      month: m,
      added: addedByMonth.get(m) ?? 0,
      cumulative,
      acquired: acqByMonth.get(m) ?? 0,
      spending: Math.round(spendByMonth.get(m) ?? 0),
    };
  });

  // --- Acquired vs not ---
  const acquiredVsNot = [
    { label: "Acquired", count: acquired.length, value: totalSpent },
    { label: "Remaining", count: remaining.length, value: wishlistValue },
  ];

  // --- Highest priority remaining items ---
  const highestPriority = [...remaining]
    .sort((a, b) => priorityMeta(b.priority).weight - priorityMeta(a.priority).weight)
    .slice(0, 8)
    .map((i) => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      imageUrl: i.imageUrl,
      priority: i.priority,
      status: i.status,
      price: totalItemCost(i),
    }));

  const mostWanted = [...remaining]
    .sort((a, b) => totalItemCost(b) - totalItemCost(a))
    .slice(0, 6)
    .map((i) => ({ id: i.id, slug: i.slug, title: i.title, imageUrl: i.imageUrl, price: totalItemCost(i) }));

  // --- Budget progress + completion prediction ---
  const now = new Date();
  const thisMonthSpend = spendByMonth.get(monthKey(now)) ?? 0;
  const thisYearSpend = [...spendByMonth.entries()]
    .filter(([m]) => m.startsWith(String(now.getFullYear())))
    .reduce((s, [, v]) => s + v, 0);

  const monthlyBudget = settings?.monthlyBudget ?? null;
  const yearlyBudget = settings?.yearlyBudget ?? null;

  // Average monthly spend across active months (fallback to monthly budget).
  const monthsWithSpend = [...spendByMonth.values()].filter((v) => v > 0);
  const avgMonthlySpend =
    monthsWithSpend.length > 0
      ? monthsWithSpend.reduce((s, v) => s + v, 0) / monthsWithSpend.length
      : monthlyBudget ?? 0;
  const paceMonthly = monthlyBudget || avgMonthlySpend || 0;
  const monthsToComplete = paceMonthly > 0 ? wishlistValue / paceMonthly : null;
  const completionDate =
    monthsToComplete != null
      ? new Date(now.getFullYear(), now.getMonth() + Math.ceil(monthsToComplete), now.getDate())
      : null;

  const budgetProgress = budgets.map((b) => {
    let spent = 0;
    if (b.scope === "CATEGORY" && b.categoryId) {
      spent = acquired
        .filter((i) => i.category?.id === b.categoryId)
        .reduce((s, i) => s + totalItemCost(i), 0);
    } else if (b.scope === "COLLECTION" && b.collectionId) {
      spent = acquired
        .filter((i) => i.collections.some((c) => c.id === b.collectionId))
        .reduce((s, i) => s + totalItemCost(i), 0);
    } else {
      spent = b.period === "YEARLY" ? thisYearSpend : b.period === "MONTHLY" ? thisMonthSpend : totalSpent;
    }
    return { ...b, spent, remaining: Math.max(0, b.amount - spent) };
  });

  const completionPct =
    acquired.length + remaining.length > 0
      ? Math.round((acquired.length / (acquired.length + remaining.length)) * 100)
      : 0;

  return {
    totals: {
      totalItems: items.length,
      activeItems: active.length,
      totalAcquired: acquired.length,
      totalWishlisted: remaining.length,
      totalCollections: collectionsCount,
      totalRooms: roomsCount,
      totalCategories: categoriesCount,
      totalValue: Math.round(totalValue),
      totalSpent: Math.round(totalSpent),
      wishlistValue: Math.round(wishlistValue),
      totalSavings: Math.round(totalSavings),
      avgPrice: Math.round(avgPrice),
      completionPct,
    },
    byCategory,
    byStatus,
    byPriority,
    byRoom,
    byCollection,
    priceDistribution,
    growthOverTime,
    acquiredVsNot,
    highestPriority,
    mostWanted,
    budgets: budgetProgress,
    prediction: {
      monthlyBudget,
      yearlyBudget,
      thisMonthSpend: Math.round(thisMonthSpend),
      thisYearSpend: Math.round(thisYearSpend),
      avgMonthlySpend: Math.round(avgMonthlySpend),
      monthsToComplete: monthsToComplete != null ? Math.ceil(monthsToComplete) : null,
      completionDate: completionDate ? completionDate.toISOString() : null,
    },
    currency: settings?.currency ?? "USD",
  };
}
