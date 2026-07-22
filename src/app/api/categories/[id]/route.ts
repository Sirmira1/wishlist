import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const data = categorySchema.partial().parse(await req.json());
  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      icon: data.icon ?? undefined,
      color: data.color ?? undefined,
      description: data.description ?? undefined,
      parentId: data.parentId ?? undefined,
    },
  });
  return ok(category);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return fail("Category not found", 404);
  await prisma.category.delete({ where: { id } });
  return ok({ success: true });
});
