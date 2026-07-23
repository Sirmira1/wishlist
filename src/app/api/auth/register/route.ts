import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword, getSettings, isSetupComplete, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Self-service sign-up. Creates a regular USER and signs them in.
export const POST = handle(async (req: Request) => {
  const rl = rateLimit(`register:${clientIp(req)}`, 5, 60_000);
  if (!rl.success) return fail("Too many attempts. Try again shortly.", 429);

  // Until the first admin exists, direct people to /setup instead.
  if (!(await isSetupComplete())) return fail("Site is not set up yet.", 409);

  const settings = await getSettings();
  if (!settings.allowRegistration) return fail("Registration is currently disabled.", 403);

  const { username, displayName, password } = registerSchema.parse(await req.json());

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return fail("That username is taken.", 409);

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, displayName: displayName || username, passwordHash, role: "USER" },
  });

  await createSession(user);
  return ok({ success: true }, { status: 201 });
});
