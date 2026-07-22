import { handle, ok } from "@/lib/api";
import { requireAdmin, generateResetCode } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Admin generates a one-time recovery code to store somewhere safe.
export const POST = handle(async () => {
  await requireAdmin();
  const code = await generateResetCode();
  return ok({ code });
});
