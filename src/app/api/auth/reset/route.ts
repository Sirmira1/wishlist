import bcrypt from "bcryptjs";
import { handle, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Recover access using a previously-generated security code.
export const POST = handle(async (req: Request) => {
  const rl = rateLimit(`reset:${clientIp(req)}`, 5, 60_000);
  if (!rl.success) return fail("Too many attempts. Try again shortly.", 429);

  const { username, code, newPassword } = resetPasswordSchema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user?.resetCodeHash) return fail("Invalid username or recovery code.", 401);

  if (!(await bcrypt.compare(code.trim(), user.resetCodeHash))) {
    return fail("Invalid username or recovery code.", 401);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    // Consume the code and invalidate existing sessions.
    data: { passwordHash, resetCodeHash: null, tokenVersion: { increment: 1 } },
  });

  return ok({ success: true });
});
