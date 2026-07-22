"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ACCENT_COLORS } from "@/lib/constants";

// Reads the saved accent color and applies it to the CSS custom properties.
export function AccentColorSync() {
  const { data } = useQuery<{ accentColor?: string }>({
    queryKey: ["settings", "accent"],
    queryFn: () => api.get("/api/settings"),
    staleTime: 60_000,
  });

  useEffect(() => {
    const name = data?.accentColor || "violet";
    const accent = ACCENT_COLORS.find((a) => a.name === name);
    if (!accent) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", accent.value);
    root.style.setProperty("--ring", accent.value);
  }, [data?.accentColor]);

  return null;
}
