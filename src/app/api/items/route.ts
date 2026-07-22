import { Prisma } from "@prisma/client";
import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, requireAdmin } from "@/lib/auth";
import { itemInclude, createItem } from "@/lib/items";
import { itemInputSchema } from "@/lib/validations";
import { effectivePrice, totalItemCost } from "@/lib/utils";
import { priorityMeta } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.getAll("status").filter(Boolean);
  const priority = searchParams.getAll("priority").filter(Boolean);
  const categoryId = searchParams.get("categoryId") || undefined;
  const collectionId = searchParams.get("collectionId") || undefined;
  const roomId = searchParams.get("roomId") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const favorite = searchParams.get("favorite");
  const pinned = searchParams.get("pinned");
  const isPcPart = searchParams.get("isPcPart");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "createdAt";
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "60", 10)));

  const where: Prisma.ItemWhereInput = {};
  const and: Prisma.ItemWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { collections: { some: { name: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (status.length) and.push({ status: { in: status } });
  if (priority.length) and.push({ priority: { in: priority } });
  if (categoryId) and.push({ categoryId });
  if (collectionId) and.push({ collections: { some: { id: collectionId } } });
  if (roomId) and.push({ rooms: { some: { id: roomId } } });
  if (tag) and.push({ tags: { has: tag } });
  if (favorite === "true") and.push({ favorite: true });
  if (pinned === "true") and.push({ pinned: true });
  if (isPcPart === "true") and.push({ isPcPart: true });
  if (and.length) where.AND = and;

  // DB-sortable fields; price/priority/total handled in-memory for correctness.
  const dbSortable: Record<string, string> = {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    title: "title",
    status: "status",
    dateAcquired: "dateAcquired",
  };
  const orderBy: Prisma.ItemOrderByWithRelationInput | undefined = dbSortable[sort]
    ? { [dbSortable[sort]]: order }
    : { updatedAt: "desc" };

  let rows = await prisma.item.findMany({ where, include: itemInclude, orderBy, take: 2000 });

  // Price range filter (computed effective price).
  const min = minPrice ? parseFloat(minPrice) : null;
  const max = maxPrice ? parseFloat(maxPrice) : null;
  if (min != null || max != null) {
    rows = rows.filter((i) => {
      const p = effectivePrice(i);
      if (min != null && p < min) return false;
      if (max != null && p > max) return false;
      return true;
    });
  }

  // In-memory sorts for computed values.
  if (sort === "price") {
    rows.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (order === "desc") rows.reverse();
  } else if (sort === "total") {
    rows.sort((a, b) => totalItemCost(a) - totalItemCost(b));
    if (order === "desc") rows.reverse();
  } else if (sort === "priority") {
    rows.sort((a, b) => priorityMeta(b.priority).weight - priorityMeta(a.priority).weight);
    if (order === "asc") rows.reverse();
  }

  // Pinned items always float to the top.
  rows.sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return ok({ items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) });
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const input = itemInputSchema.parse(await req.json());
  const item = await createItem(input);
  return ok(item, { status: 201 });
});
