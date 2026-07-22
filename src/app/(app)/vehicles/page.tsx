"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Car, Plus, Gauge, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { api } from "@/lib/api-client";
import { formatCurrency, totalItemCost } from "@/lib/utils";
import { useSettingsCurrency } from "@/hooks/use-currency";
import { useSession } from "@/hooks/queries";
import type { ItemsResponse } from "@/types";

export default function VehiclesPage() {
  const currency = useSettingsCurrency();
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["items", "vehicles"],
    queryFn: () => api.get<ItemsResponse>("/api/items?pageSize=200"),
  });

  const vehicles = (data?.items ?? []).filter((i) => i.vehicle);
  const totalTarget = vehicles.reduce((s, i) => s + (i.vehicle?.targetPrice ?? totalItemCost(i)), 0);

  return (
    <div>
      <PageHeader title="Vehicles" description="Track your dream cars and motorcycles with the details that matter." icon={Car}>
        {session?.isAdmin && (
          <Button asChild variant="gradient"><Link href="/items/new"><Plus className="h-4 w-4" /> Add Vehicle</Link></Button>
        )}
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add an item and toggle “This is a vehicle” in the Advanced tab to track it here."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Vehicles" value={vehicles.length} icon={Car} accent="#ef4444" />
            <StatCard label="Total Target" value={formatCurrency(totalTarget, currency)} icon={Zap} accent="#f59e0b" />
            <StatCard label="Acquired" value={vehicles.filter((v) => ["ACQUIRED", "COMPLETED", "DELIVERED"].includes(v.status)).length} accent="#22c55e" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {vehicles.map((v) => (
              <Link key={v.id} href={`/items/${v.slug}`}>
                <Card className="card-hover overflow-hidden">
                  <div className="flex">
                    <div className="h-36 w-44 shrink-0 bg-muted">
                      {v.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.imageUrl} alt={v.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/40"><Car className="h-10 w-10" /></div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={v.status} />
                        <PriorityBadge priority={v.priority} />
                      </div>
                      <h3 className="mt-2 font-semibold">{v.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {[v.vehicle?.year, v.vehicle?.make, v.vehicle?.model, v.vehicle?.trim].filter(Boolean).join(" ")}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {v.vehicle?.horsepower && <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> {v.vehicle.horsepower} hp</span>}
                        {v.vehicle?.mileage != null && <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> {v.vehicle.mileage.toLocaleString()} mi</span>}
                      </div>
                      <p className="mt-2 text-lg font-bold">
                        {formatCurrency(v.vehicle?.targetPrice ?? totalItemCost(v), currency)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
