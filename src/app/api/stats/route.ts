import { handle, ok, fail } from "@/lib/api";
import { canView } from "@/lib/auth";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const stats = await computeStats();
  return ok(stats);
});
