"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Filters } from "@/store/ui";
import type {
  Item,
  ItemsResponse,
  Category,
  Collection,
  Room,
  Budget,
  Activity,
  Session,
} from "@/types";
import type { Stats } from "@/lib/stats";

function itemsQueryString(f: Partial<Filters> & { page?: number; pageSize?: number }): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  f.status?.forEach((s) => p.append("status", s));
  f.priority?.forEach((s) => p.append("priority", s));
  if (f.categoryId) p.set("categoryId", f.categoryId);
  if (f.collectionId) p.set("collectionId", f.collectionId);
  if (f.roomId) p.set("roomId", f.roomId);
  if (f.tag) p.set("tag", f.tag);
  if (f.favorite) p.set("favorite", "true");
  if (f.minPrice) p.set("minPrice", f.minPrice);
  if (f.maxPrice) p.set("maxPrice", f.maxPrice);
  if (f.sort) p.set("sort", f.sort);
  if (f.order) p.set("order", f.order);
  if (f.page) p.set("page", String(f.page));
  if (f.pageSize) p.set("pageSize", String(f.pageSize));
  return p.toString();
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => api.get<Session>("/api/auth/session"),
    staleTime: 30_000,
  });
}

export function useItems(filters: Partial<Filters> & { page?: number; pageSize?: number }) {
  const qs = itemsQueryString(filters);
  return useQuery({
    queryKey: ["items", qs],
    queryFn: () => api.get<ItemsResponse>(`/api/items?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useItem(idOrSlug: string) {
  return useQuery({
    queryKey: ["item", idOrSlug],
    queryFn: () => api.get<Item>(`/api/items/${idOrSlug}`),
    enabled: Boolean(idOrSlug),
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => api.get<Category[]>("/api/categories") });
}

export function useCollections() {
  return useQuery({ queryKey: ["collections"], queryFn: () => api.get<Collection[]>("/api/collections") });
}

export function useRooms() {
  return useQuery({ queryKey: ["rooms"], queryFn: () => api.get<Room[]>("/api/rooms") });
}

export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: () => api.get<Budget[]>("/api/budgets") });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: () => api.get<Stats>("/api/stats") });
}

export function useActivity(limit = 30) {
  return useQuery({
    queryKey: ["activity", limit],
    queryFn: () => api.get<Activity[]>(`/api/activity?limit=${limit}`),
  });
}

/** Invalidate everything that depends on item data. */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["items"] });
  qc.invalidateQueries({ queryKey: ["stats"] });
  qc.invalidateQueries({ queryKey: ["activity"] });
  qc.invalidateQueries({ queryKey: ["collections"] });
  qc.invalidateQueries({ queryKey: ["rooms"] });
  qc.invalidateQueries({ queryKey: ["categories"] });
  qc.invalidateQueries({ queryKey: ["budgets"] });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post<Item>("/api/items", body),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.patch<Item>(`/api/items/${id}`, body),
    onSuccess: (item) => {
      invalidateAll(qc);
      qc.invalidateQueries({ queryKey: ["item", id] });
      if (item?.slug) qc.invalidateQueries({ queryKey: ["item", item.slug] });
    },
  });
}

export function useQuickUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch<Item>(`/api/items/${id}/quick`, patch),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/items/${id}`),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDuplicateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Item>(`/api/items/${id}/duplicate`),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post<Collection>("/api/collections", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post<Room>("/api/rooms", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post<Category>("/api/categories", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post<Budget>("/api/budgets", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch<Budget>(`/api/budgets/${id}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/budgets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useAddPricePoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemId: string; price: number; source?: string; note?: string }) =>
      api.post("/api/price-history", body),
    onSuccess: (_d, vars) => {
      invalidateAll(qc);
      qc.invalidateQueries({ queryKey: ["item", vars.itemId] });
    },
  });
}
