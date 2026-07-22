import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const rate = 1.36;
const round = (value: number | null | undefined) => {
  if (value == null) return value;
  return Math.round(value * rate * 100) / 100;
};

async function main() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    throw new Error("Settings singleton not found");
  }

  await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      currency: "CAD",
      monthlyBudget: settings.monthlyBudget ? round(settings.monthlyBudget) : null,
      yearlyBudget: settings.yearlyBudget ? round(settings.yearlyBudget) : null,
      savingsGoal: settings.savingsGoal ? round(settings.savingsGoal) : null,
      savingsCurrent: settings.savingsCurrent ? round(settings.savingsCurrent) : null,
    },
  });

  const items = await prisma.item.findMany({
    select: {
      id: true,
      msrp: true,
      currentPrice: true,
      discountPrice: true,
      taxEstimate: true,
      shippingEstimate: true,
      priceHistory: { select: { id: true, price: true } },
    },
  });

  let itemUpdated = 0;
  for (const item of items) {
    const data: Record<string, number | null> = {};
    for (const field of ["msrp", "currentPrice", "discountPrice", "taxEstimate", "shippingEstimate"] as const) {
      const value = item[field];
      if (typeof value === "number") data[field] = round(value);
    }

    if (Object.keys(data).length > 0) {
      await prisma.item.update({ where: { id: item.id }, data });
      itemUpdated++;
    }

    for (const history of item.priceHistory) {
      await prisma.priceHistory.update({
        where: { id: history.id },
        data: { price: round(history.price) ?? history.price },
      });
    }
  }

  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, targetPrice: true, ownershipCost: true },
  });

  let vehicleUpdated = 0;
  for (const vehicle of vehicles) {
    const data: Record<string, number | null> = {};
    for (const field of ["targetPrice", "ownershipCost"] as const) {
      const value = vehicle[field];
      if (typeof value === "number") data[field] = round(value);
    }

    if (Object.keys(data).length > 0) {
      await prisma.vehicle.update({ where: { id: vehicle.id }, data });
      vehicleUpdated++;
    }
  }

  const budgets = await prisma.budget.findMany({ select: { id: true, amount: true } });
  let budgetUpdated = 0;
  for (const budget of budgets) {
    await prisma.budget.update({
      where: { id: budget.id },
      data: { amount: round(budget.amount) ?? budget.amount },
    });
    budgetUpdated++;
  }

  const collections = await prisma.collection.findMany({ select: { id: true, targetBudget: true } });
  let collectionUpdated = 0;
  for (const collection of collections) {
    if (typeof collection.targetBudget === "number") {
      await prisma.collection.update({
        where: { id: collection.id },
        data: { targetBudget: round(collection.targetBudget) ?? collection.targetBudget },
      });
      collectionUpdated++;
    }
  }

  console.log(JSON.stringify({
    rate,
    itemsConverted: itemUpdated,
    vehiclesConverted: vehicleUpdated,
    budgetsConverted: budgetUpdated,
    collectionsConverted: collectionUpdated,
  }, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
