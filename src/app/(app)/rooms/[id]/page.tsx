"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { GalleryView } from "@/components/items/item-views";
import { api } from "@/lib/api-client";
import { formatCurrency, totalItemCost, pct } from "@/lib/utils";
import { ACQUIRED_STATUSES } from "@/lib/constants";
import { useSettingsCurrency } from "@/hooks/use-currency";
import type { Item } from "@/types";

type RoomDetail = { id: string; name: string; description?: string | null; items: Item[] };

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const currency = useSettingsCurrency();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["room", id],
    queryFn: () => api.get<RoomDetail>(`/api/rooms/${id}`),
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (isError || !data) return notFound();

  const items = data.items ?? [];
  const acquired = items.filter((i) => ACQUIRED_STATUSES.has(i.status)).length;
  const value = items.reduce((s, i) => s + totalItemCost(i), 0);
  const remaining = value - items.filter((i) => ACQUIRED_STATUSES.has(i.status)).reduce((s, i) => s + totalItemCost(i), 0);
  const progress = pct(acquired, items.length);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/rooms"><ArrowLeft className="h-4 w-4" /> Rooms</Link>
      </Button>
      <PageHeader title={data.name} description={data.description ?? undefined} icon={DoorOpen} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Items" value={items.length} accent="#8b5cf6" />
        <StatCard label="Acquired" value={`${acquired}/${items.length}`} accent="#22c55e" />
        <StatCard label="Total Value" value={formatCurrency(value, currency)} accent="#06b6d4" />
        <StatCard label="Remaining" value={formatCurrency(remaining, currency)} accent="#f59e0b" />
      </div>

      <div className="mb-6 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Room completion</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {items.length ? (
        <GalleryView items={items} />
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">No items assigned to this room yet.</p>
      )}
    </div>
  );
}
