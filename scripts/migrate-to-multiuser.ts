// One-time migration: single-admin → multi-user.
// Creates an ADMIN User from the legacy Settings credentials and assigns all
// existing items/collections/rooms/budgets/activity to that user.
// Safe to run more than once (idempotent).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) throw new Error("Settings singleton not found — nothing to migrate.");
  if (!settings.passwordHash) {
    throw new Error("Legacy admin has no passwordHash. Complete /setup first, then re-run.");
  }

  // 1. Ensure an ADMIN user exists (reuse legacy username + password hash).
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    admin = await prisma.user.findUnique({ where: { username: settings.adminUsername } });
  }
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: settings.adminUsername,
        displayName: settings.adminUsername,
        passwordHash: settings.passwordHash,
        role: "ADMIN",
        monthlyBudget: settings.monthlyBudget,
        yearlyBudget: settings.yearlyBudget,
        savingsGoal: settings.savingsGoal,
        savingsCurrent: settings.savingsCurrent ?? 0,
      },
    });
    console.log(`✓ Created ADMIN user "${admin.username}" (${admin.id})`);
  } else {
    if (admin.role !== "ADMIN") {
      admin = await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    }
    console.log(`• ADMIN user already exists: "${admin.username}" (${admin.id})`);
  }

  // 2. Backfill ownership on anything not yet owned.
  const [items, cols, rooms, budgets, activity] = await Promise.all([
    prisma.item.updateMany({ where: { userId: null }, data: { userId: admin.id } }),
    prisma.collection.updateMany({ where: { userId: null }, data: { userId: admin.id } }),
    prisma.room.updateMany({ where: { userId: null }, data: { userId: admin.id } }),
    prisma.budget.updateMany({ where: { userId: null }, data: { userId: admin.id } }),
    prisma.activity.updateMany({ where: { userId: null }, data: { userId: admin.id } }),
  ]);

  console.log(
    `✓ Assigned to admin — items:${items.count} collections:${cols.count} rooms:${rooms.count} budgets:${budgets.count} activity:${activity.count}`
  );

  const totalUsers = await prisma.user.count();
  console.log(`Users in system: ${totalUsers}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("MIGRATION DONE ✔");
  })
  .catch(async (e) => {
    console.error("MIGRATION FAILED:", e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
