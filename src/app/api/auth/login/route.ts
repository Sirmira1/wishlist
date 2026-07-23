import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: Request) => {
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  if (!rl.success) return fail("Too many login attempts. Please wait a minute.", 429);

  const { username, password } = loginSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { username } });
  // Verify against a real hash when possible; otherwise a decoy compare to
  // keep timing roughly constant regardless of whether the user exists.
  const hash = user?.passwordHash ?? "$2a$12$0000000000000000000000000000000000000000000000000000";
  const validPass = await verifyPassword(password, hash);

  if (!user || !validPass) return fail("Invalid username or password.", 401);

  await createSession(user);
  return ok({ success: true, role: user.role });
});
