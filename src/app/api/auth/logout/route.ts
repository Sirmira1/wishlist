import { handle, ok } from "@/lib/api";
import { clearSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = handle(async () => {
  await clearSession();
  return ok({ success: true });
});
