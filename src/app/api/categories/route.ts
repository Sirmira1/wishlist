import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return ok(categories);
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = categorySchema.parse(await req.json());
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: slugify(data.name) + "-" + Math.random().toString(36).slice(2, 5),
      icon: data.icon ?? null,
      color: data.color ?? null,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
    },
  });
  await logActivity("CATEGORY_CREATED", `Created category “${category.name}”`);
  return ok(category, { status: 201 });
});
