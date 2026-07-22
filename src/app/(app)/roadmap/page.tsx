"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { api } from "@/lib/api-client";
import { formatCurrency, totalItemCost } from "@/lib/utils";
import { ACQUIRED_STATUSES, priorityMeta } from "@/lib/constants";
import { useSettingsCurrency } from "@/hooks/use-currency";
import type { ItemsResponse, Item } from "@/types";

export default function RoadmapPage() {
  const currency = useSettingsCurrency();
  const { data, isLoading } = useQuery({
    queryKey: ["items", "roadmap"],
    queryFn: () => api.get<ItemsResponse>("/api/items?pageSize=200"),
  });

  const items = data?.items ?? [];
  const acquired = items.filter((i) => ACQUIRED_STATUSES.has(i.status) && i.dateAcquired);
  const planned = items
    .filter((i) => !ACQUIRED_STATUSES.has(i.status) && i.status !== "ARCHIVED")
    .sort((a, b) => priorityMeta(b.priority).weight - priorityMeta(a.priority).weight);

  const byYear = new Map<number, Item[]>();
  for (const i of acquired) {
    const y = new Date(i.dateAcquired!).getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(i);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div>
      <PageHeader title="Roadmap" description="Your lifetime acquisition history and what’s coming next." icon={MapIcon} />

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Acquired</h3>
            {years.length === 0 && <p className="text-sm text-muted-foreground">Nothing acquired yet — your history starts with your first purchase.</p>}
            {years.map((year) => {
              const yearItems = byYear.get(year)!;
              const value = yearItems.reduce((s, i) => s + totalItemCost(i), 0);
              return (
                <div key={year} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 h-full w-px bg-border" />
                  <div className="absolute -left-1.5 top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-lg font-bold">{year}</h4>
                    <span className="text-sm text-muted-foreground">{yearItems.length} items · {formatCurrency(value, currency)}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {yearItems.map((i) => (
                      <Link key={i.id} href={`/items/${i.slug}`} className="glass card-hover flex items-center gap-3 rounded-xl p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{i.title}</p>
                          <StatusBadge status={i.status} />
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(totalItemCost(i), currency)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Planned */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-4 w-4" /> Up next
            </h3>
            <Card className="p-4">
              {planned.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nothing planned.</p>
              ) : (
                <div className="space-y-1.5">
                  {planned.slice(0, 15).map((i) => (
                    <Link key={i.id} href={`/items/${i.slug}`} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent/50">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.title}</span>
                      <PriorityBadge priority={i.priority} />
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
