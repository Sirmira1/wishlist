import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { itemInputSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { uniqueSlug, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

const importSchema = z.object({
  // Already-mapped rows from the client field-mapping wizard.
  items: z.array(z.record(z.any())),
  createMissingCategories: z.boolean().optional().default(true),
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const { items, createMissingCategories } = importSchema.parse(await req.json());

  // Pre-resolve category names → ids.
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  let created = 0;
  const errors: { row: number; error: string }[] = [];

  for (let idx = 0; idx < items.length; idx++) {
    const raw = items[idx];
    try {
      // Resolve category by name if provided as string.
      let categoryId: string | null = raw.categoryId ?? null;
      const catName = (raw.category ?? raw.Category) as string | undefined;
      if (!categoryId && catName) {
        categoryId = catByName.get(catName.toLowerCase()) ?? null;
        if (!categoryId && createMissingCategories) {
          const c = await prisma.category.create({
            data: { name: catName, slug: slugify(catName) + "-" + Math.random().toString(36).slice(2, 5) },
          });
          catByName.set(catName.toLowerCase(), c.id);
          categoryId = c.id;
        }
      }

      const parsed = itemInputSchema.parse({
        ...raw,
        categoryId,
        tags:
          typeof raw.tags === "string"
            ? raw.tags.split(/[;,]/).map((t: string) => t.trim()).filter(Boolean)
            : raw.tags,
      });

      await prisma.item.create({
        data: {
          title: parsed.title,
          slug: uniqueSlug(parsed.title),
          description: parsed.description ?? null,
          brand: parsed.brand ?? null,
          model: parsed.model ?? null,
          color: parsed.color ?? null,
          condition: parsed.condition ?? null,
          tags: parsed.tags ?? [],
          subcategory: parsed.subcategory ?? null,
          priority: parsed.priority,
          status: parsed.status,
          store: parsed.store ?? null,
          vendor: parsed.vendor ?? null,
          url: parsed.url ?? null,
          imageUrl: parsed.imageUrl ?? null,
          sku: parsed.sku ?? null,
          msrp: parsed.msrp ?? null,
          currentPrice: parsed.currentPrice ?? null,
          discountPrice: parsed.discountPrice ?? null,
          taxEstimate: parsed.taxEstimate ?? null,
          shippingEstimate: parsed.shippingEstimate ?? null,
          quantityDesired: parsed.quantityDesired ?? 1,
          quantityOwned: parsed.quantityOwned ?? 0,
          categoryId,
        },
      });
      created++;
    } catch (e) {
      errors.push({ row: idx + 1, error: (e as Error).message.slice(0, 200) });
    }
  }

  await logActivity("IMPORT", `Imported ${created} item(s)`);
  return ok({ created, failed: errors.length, errors: errors.slice(0, 25) });
});
