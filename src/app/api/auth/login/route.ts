import { handle, ok, fail } from "@/lib/api";
import { getSettings, verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: Request) => {
  const rl = rateLimit(`login:${clientIp(req)}`, 8, 60_000);
  if (!rl.success) return fail("Too many login attempts. Please wait a minute.", 429);

  const body = await req.json();
  const { username, password } = loginSchema.parse(body);

  const settings = await getSettings();
  if (!settings.passwordHash) return fail("Setup has not been completed yet.", 409);

  const validUser = username === settings.adminUsername;
  const validPass = await verifyPassword(password, settings.passwordHash);
  // Constant-ish response regardless of which half failed.
  if (!validUser || !validPass) return fail("Invalid username or password.", 401);

  await createSession(settings.adminUsername, settings.tokenVersion, settings.autoLogoutMinutes);
  return ok({ success: true });
});
