import { prisma } from "./prisma";

type ActivityType =
  | "ITEM_ADDED"
  | "ITEM_UPDATED"
  | "ITEM_DELETED"
  | "PRICE_UPDATED"
  | "STATUS_CHANGED"
  | "ITEM_ACQUIRED"
  | "COLLECTION_CREATED"
  | "COLLECTION_UPDATED"
  | "ROOM_CREATED"
  | "ROOM_UPDATED"
  | "CATEGORY_CREATED"
  | "BUDGET_UPDATED"
  | "IMPORT"
  | "SETTINGS_UPDATED";

export async function logActivity(
  type: ActivityType,
  message: string,
  opts: { itemId?: string; itemTitle?: string; userId?: string; meta?: Record<string, unknown> } = {}
) {
  try {
    await prisma.activity.create({
      data: {
        type,
        message,
        itemId: opts.itemId,
        itemTitle: opts.itemTitle,
        userId: opts.userId,
        meta: opts.meta as object | undefined,
      },
    });
  } catch {
    // Never let activity logging break a mutation.
  }
}
