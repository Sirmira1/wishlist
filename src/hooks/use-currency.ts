"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useSettingsCurrency(): string {
  const { data } = useQuery<{ currency?: string }>({
    queryKey: ["settings", "currency"],
    queryFn: () => api.get("/api/settings"),
    staleTime: 60_000,
  });
  return data?.currency || "USD";
}
