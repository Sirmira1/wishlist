import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Public list of people and how many items each is tracking.
export const GET = handle(async () => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
      _count: { select: { items: true, collections: true, rooms: true } },
    },
  });
  return ok(users);
});
