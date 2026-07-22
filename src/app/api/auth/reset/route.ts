import bcrypt from "bcryptjs";
import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSettings, hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Recover access using a previously-generated security code.
export const POST = handle(async (req: Request) => {
  const rl = rateLimit(`reset:${clientIp(req)}`, 5, 60_000);
  if (!rl.success) return fail("Too many attempts. Try again shortly.", 429);

  const { code, newPassword } = resetPasswordSchema.parse(await req.json());
  const settings = await getSettings();
  if (!settings.resetCodeHash) return fail("No recovery code has been set up.", 409);

  if (!(await bcrypt.compare(code.trim(), settings.resetCodeHash))) {
    return fail("Invalid recovery code.", 401);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.settings.update({
    where: { id: settings.id },
    // Consume the code and invalidate all existing sessions.
    data: { passwordHash, resetCodeHash: null, tokenVersion: { increment: 1 } },
  });

  return ok({ success: true });
});
