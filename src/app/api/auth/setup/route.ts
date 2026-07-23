import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword, isSetupComplete, createSession } from "@/lib/auth";
import { setupSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function seedDefaultCategories() {
  const count = await prisma.category.count();
  if (count > 0) return;
  const byName = new Map<string, string>();
  // Create parents first, then children so parentId resolves.
  for (const c of DEFAULT_CATEGORIES.filter((c) => !c.parent)) {
    const created = await prisma.category.create({
      data: { name: c.name, slug: slugify(c.name), icon: c.icon, color: c.color },
    });
    byName.set(c.name, created.id);
  }
  for (const c of DEFAULT_CATEGORIES.filter((c) => c.parent)) {
    const created = await prisma.category.create({
      data: {
        name: c.name,
        slug: slugify(c.name),
        icon: c.icon,
        color: c.color,
        parentId: c.parent ? byName.get(c.parent) : undefined,
      },
    });
    byName.set(c.name, created.id);
  }
}

export const POST = handle(async (req: Request) => {
  const rl = rateLimit(`setup:${clientIp(req)}`, 5, 60_000);
  if (!rl.success) return fail("Too many attempts. Try again shortly.", 429);

  if (await isSetupComplete()) return fail("Setup already completed.", 409);

  const body = await req.json();
  const { username, password } = setupSchema.parse(body);

  const passwordHash = await hashPassword(password);
  const admin = await prisma.user.create({
    data: { username, displayName: username, passwordHash, role: "ADMIN" },
  });

  await seedDefaultCategories();
  await createSession(admin);

  return ok({ success: true });
});
