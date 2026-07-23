import { handle, ok, fail } from "@/lib/api";
import { canView, resolveWishlistOwner } from "@/lib/auth";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

// Whose stats: explicit ?userId, else the logged-in user, else the admin
// (so anonymous visitors see the admin's wishlist by default).
export const GET = handle(async (req: Request) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const ownerId = await resolveWishlistOwner(new URL(req.url).searchParams.get("userId"));
  const stats = await computeStats(ownerId);
  return ok(stats);
});
