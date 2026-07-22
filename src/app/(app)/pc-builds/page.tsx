"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Cpu, Plus, Download, Package } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/badges";
import { api } from "@/lib/api-client";
import { PC_PART_TYPES } from "@/lib/constants";
import { formatCurrency, totalItemCost, effectivePrice } from "@/lib/utils";
import { useSettingsCurrency } from "@/hooks/use-currency";
import { useSession } from "@/hooks/queries";
import type { ItemsResponse, Item } from "@/types";

export default function PcBuildsPage() {
  const currency = useSettingsCurrency();
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["pc-parts"],
    queryFn: () => api.get<ItemsResponse>("/api/items?isPcPart=true&pageSize=200"),
  });

  const parts = data?.items ?? [];
  const total = parts.reduce((s, i) => s + totalItemCost(i), 0);
  const byType = new Map<string, Item[]>();
  for (const p of parts) {
    const key = p.pcPartType || "OTHER";
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(p);
  }

  function exportSummary() {
    const lines = ["PC BUILD SUMMARY", "================", ""];
    for (const type of [...PC_PART_TYPES, "OTHER"]) {
      const items = byType.get(type);
      if (!items?.length) continue;
      lines.push(`${type}:`);
      for (const i of items) {
        lines.push(`  - ${i.title}${effectivePrice(i) ? ` — ${formatCurrency(totalItemCost(i), currency)}` : ""}`);
      }
      lines.push("");
    }
    lines.push(`TOTAL: ${formatCurrency(total, currency)}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pc-build-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Build summary exported");
  }

  return (
    <div>
      <PageHeader title="PC Build Tracker" description="Plan and price your dream PC build, slot by slot." icon={Cpu}>
        {parts.length > 0 && (
          <Button variant="outline" onClick={exportSummary}><Download className="h-4 w-4" /> Export</Button>
        )}
        {session?.isAdmin && (
          <Button asChild variant="gradient"><Link href="/items/new"><Plus className="h-4 w-4" /> Add Part</Link></Button>
        )}
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : parts.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No PC parts yet"
          description="Add items and mark them as a “PC Part” with a part type to build out your rig here."
          action={session?.isAdmin ? <Button asChild variant="gradient"><Link href="/items/new">Add a part</Link></Button> : undefined}
        />
      ) : (
        <div className="space-y-6">
          <Card className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Estimated build cost</p>
              <p className="text-3xl font-bold">{formatCurrency(total, currency)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {parts.length} part{parts.length === 1 ? "" : "s"} across {byType.size} slots
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...PC_PART_TYPES, "OTHER"].map((type) => {
              const items = byType.get(type);
              return (
                <Card key={type} className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">{type}</span>
                    {items?.length ? (
                      <span className="text-sm font-medium">
                        {formatCurrency(items.reduce((s, i) => s + totalItemCost(i), 0), currency)}
                      </span>
                    ) : (
                      <Badge variant="muted">empty</Badge>
                    )}
                  </div>
                  {items?.length ? (
                    <div className="space-y-1.5">
                      {items.map((i) => (
                        <Link key={i.id} href={`/items/${i.slug}`} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-accent/50">
                          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-muted">
                            {i.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">{i.title}</span>
                          <StatusBadge status={i.status} className="hidden sm:inline-flex" />
                          <span className="text-sm font-medium">{formatCurrency(totalItemCost(i), currency)}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No {type.toLowerCase()} selected yet.</p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
