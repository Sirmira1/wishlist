"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Lock, ArrowRight, Package, Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { GalleryView } from "@/components/items/item-views";
import { StatCard } from "@/components/stat-card";
import { api, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import type { ItemsResponse } from "@/types";
import type { Stats } from "@/lib/stats";

export default function PublicPage() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => api.get<Stats>("/api/stats"), retry: false });
  const items = useQuery({
    queryKey: ["items", "public"],
    queryFn: () => api.get<ItemsResponse>("/api/items?pageSize=60&sort=priority"),
    retry: false,
  });

  const isPrivate =
    (stats.error instanceof ApiError && stats.error.status === 403) ||
    (items.error instanceof ApiError && items.error.status === 403);

  const currency = stats.data?.currency ?? "USD";
  const t = stats.data?.totals;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(120deg,hsl(var(--primary)),hsl(189_94%_45%))] text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-semibold text-gradient">Life Wishlist</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm"><Link href="/">Open app <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {isPrivate ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"><Lock className="h-8 w-8 text-muted-foreground" /></div>
            <h1 className="text-2xl font-bold">This wishlist is private</h1>
            <p className="mt-2 max-w-sm text-muted-foreground">The owner has turned off public viewing. Check back later.</p>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" /> A public wishlist
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Everything I Want</h1>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                A curated list of things to own, build, collect and experience — tracked in real time.
              </p>
            </div>

            {t && (
              <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Items" value={t.totalItems} icon={Package} accent="#8b5cf6" />
                <StatCard label="Wishlist Value" value={formatCurrency(t.wishlistValue, currency)} icon={Wallet} accent="#06b6d4" />
                <StatCard label="Acquired" value={t.totalAcquired} icon={CheckCircle2} accent="#22c55e" />
                <StatCard label="Completion" value={`${t.completionPct}%`} icon={Sparkles} accent="#f59e0b" />
              </div>
            )}

            {items.isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
              </div>
            ) : (
              <GalleryView items={items.data?.items ?? []} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
