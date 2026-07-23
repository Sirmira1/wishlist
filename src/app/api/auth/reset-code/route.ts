import { handle, ok } from "@/lib/api";
import { requireUser, generateResetCode } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Generate a one-time recovery code for the current account.
export const POST = handle(async () => {
  const session = await requireUser();
  const code = await generateResetCode(session.userId);
  return ok({ code });
});
