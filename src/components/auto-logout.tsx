"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/hooks/queries";
import { api } from "@/lib/api-client";

// Keeps an active admin signed in (sliding session) while still enforcing an
// inactivity timeout. The session cookie lives for `autoLogoutMinutes`; we
// renew it periodically as long as there's activity, and let it lapse otherwise.
export function AutoLogout() {
  const { data: session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const lastActivity = useRef(Date.now());
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    if (!session?.isAuthenticated) return;
    const idleLimit = (session.autoLogoutMinutes || 30) * 60_000;
    // Renew at most this often while active — comfortably before the cookie expires.
    const refreshEvery = Math.max(60_000, Math.floor(idleLimit / 3));

    const markActive = () => {
      lastActivity.current = Date.now();
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    // Renew immediately on mount/navigation so a reload always starts a fresh window.
    api.post("/api/auth/refresh").catch(() => {});
    lastRefresh.current = Date.now();

    const tick = setInterval(async () => {
      const now = Date.now();
      const idle = now - lastActivity.current;

      if (idle >= idleLimit) {
        await api.post("/api/auth/logout").catch(() => {});
        await qc.invalidateQueries();
        toast("Signed out due to inactivity");
        router.refresh();
        return;
      }
      if (now - lastRefresh.current >= refreshEvery) {
        lastRefresh.current = now;
        await api.post("/api/auth/refresh").catch(() => {});
      }
    }, 60_000);

    return () => {
      clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, markActive));
    };
  }, [session?.isAuthenticated, session?.autoLogoutMinutes, qc, router]);

  return null;
}
