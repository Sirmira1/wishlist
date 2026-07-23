import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/auth";

export const dynamic = "force-dynamic";

// A single person's public profile (by id or username).
export const GET = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { username: id }] },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
      _count: { select: { items: true, collections: true, rooms: true } },
    },
  });
  if (!user) return fail("User not found", 404);
  return ok(user);
});
