"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Package, Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { GalleryView } from "@/components/items/item-views";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api-client";
import { formatCurrency, initials } from "@/lib/utils";
import type { ItemsResponse, PublicUser } from "@/types";
import type { Stats } from "@/lib/stats";

export default function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useQuery({ queryKey: ["user", id], queryFn: () => api.get<PublicUser>(`/api/users/${id}`), retry: false });
  const items = useQuery({
    queryKey: ["items", "by-user", user.data?.id],
    queryFn: () => api.get<ItemsResponse>(`/api/items?userId=${user.data!.id}&pageSize=200`),
    enabled: Boolean(user.data?.id),
  });
  const stats = useQuery({
    queryKey: ["stats", "by-user", user.data?.id],
    queryFn: () => api.get<Stats>(`/api/stats?userId=${user.data!.id}`),
    enabled: Boolean(user.data?.id),
  });

  if (user.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (user.isError || !user.data) return notFound();

  const u = user.data;
  const name = u.displayName || u.username;
  const t = stats.data?.totals;
  const currency = stats.data?.currency ?? "USD";

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/people"><ArrowLeft className="h-4 w-4" /> People</Link>
      </Button>

      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
          {initials(name)}
        </span>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {name}
            {u.role === "ADMIN" && <ShieldCheck className="h-5 w-5 text-primary" />}
          </h1>
          <p className="text-sm text-muted-foreground">@{u.username}’s wishlist</p>
        </div>
      </div>

      {t && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Items" value={t.totalItems} icon={Package} accent="#8b5cf6" />
          <StatCard label="Wishlist Value" value={formatCurrency(t.wishlistValue, currency)} icon={Wallet} accent="#06b6d4" />
          <StatCard label="Acquired" value={t.totalAcquired} icon={CheckCircle2} accent="#22c55e" />
          <StatCard label="Completion" value={`${t.completionPct}%`} accent="#f59e0b" />
        </div>
      )}

      {items.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : items.data?.items.length ? (
        <GalleryView items={items.data.items} />
      ) : (
        <EmptyState icon={Package} title="Nothing here yet" description={`${name} hasn’t added any items.`} />
      )}
    </div>
  );
}
