import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
  const activity = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return ok(activity);
});
