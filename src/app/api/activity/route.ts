import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView, resolveWishlistOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));

  // Same scoping as stats: explicit user, else current user, else admin.
  const ownerId = await resolveWishlistOwner(searchParams.get("userId"));

  const activity = await prisma.activity.findMany({
    where: ownerId ? { userId: ownerId } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return ok(activity);
});
