"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/hooks/queries";
import { api } from "@/lib/api-client";

// Signs the admin out after a period of inactivity (configurable in Settings).
export function AutoLogout() {
  const { data: session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!session?.isAdmin) return;
    const minutes = session.autoLogoutMinutes || 30;
    const ms = minutes * 60 * 1000;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await api.post("/api/auth/logout").catch(() => {});
        await qc.invalidateQueries();
        toast("Signed out due to inactivity");
        router.refresh();
      }, ms);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [session?.isAdmin, session?.autoLogoutMinutes, qc, router]);

  return null;
}
