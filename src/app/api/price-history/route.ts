import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { priceHistorySchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

// Manually record a price point; also updates the item's current price.
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const data = priceHistorySchema.parse(await req.json());
  const item = await prisma.item.findUnique({ where: { id: data.itemId } });
  if (!item) return fail("Item not found", 404);

  const entry = await prisma.priceHistory.create({
    data: { itemId: data.itemId, price: data.price, source: data.source ?? "manual", note: data.note ?? null },
  });
  await prisma.item.update({ where: { id: data.itemId }, data: { currentPrice: data.price } });

  await logActivity("PRICE_UPDATED", `Recorded new price for “${item.title}”`, {
    itemId: item.id,
    itemTitle: item.title,
    meta: { from: item.currentPrice, to: data.price },
  });
  return ok(entry, { status: 201 });
});
