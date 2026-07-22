import { z } from "zod";
import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { itemInclude } from "@/lib/items";
import { logActivity } from "@/lib/activity";
import { ACQUIRED_STATUSES, statusMeta } from "@/lib/constants";

export const dynamic = "force-dynamic";

const quickSchema = z.object({
  favorite: z.boolean().optional(),
  pinned: z.boolean().optional(),
  status: z.string().optional(),
});

// Lightweight partial update for card quick-actions (toggle favorite/pin/status).
export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const patch = quickSchema.parse(await req.json());
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return fail("Item not found", 404);

  const nowAcquired =
    patch.status != null &&
    ACQUIRED_STATUSES.has(patch.status) &&
    !ACQUIRED_STATUSES.has(existing.status);

  const item = await prisma.item.update({
    where: { id },
    data: {
      ...patch,
      dateAcquired: nowAcquired && !existing.dateAcquired ? new Date() : undefined,
    },
    include: itemInclude,
  });

  if (patch.status && patch.status !== existing.status) {
    await logActivity("STATUS_CHANGED", `“${item.title}” → ${statusMeta(item.status).label}`, {
      itemId: item.id,
      itemTitle: item.title,
      meta: { from: existing.status, to: item.status },
    });
    if (nowAcquired) {
      await logActivity("ITEM_ACQUIRED", `Acquired “${item.title}” 🎉`, {
        itemId: item.id,
        itemTitle: item.title,
      });
    }
  }
  return ok(item);
});
