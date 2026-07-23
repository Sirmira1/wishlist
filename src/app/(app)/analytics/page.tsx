"use client";

import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartCard,
  DonutChart,
  BarChartComp,
  AreaChartComp,
  LineChartComp,
  TreemapChart,
} from "@/components/charts";
import { useStats } from "@/hooks/queries";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useStats();
  const currency = stats?.currency ?? "USD";
  const fc = (v: number) => formatCurrency(v, currency);
  const fcc = (v: number) => formatCurrencyCompact(v, currency);

  if (isLoading || !stats) {
    return (
      <div>
        <PageHeader title="Analytics" description="Deep insight into your wishlist & spending." icon={BarChart3} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const t = stats.totals;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Deep insight into your wishlist, spending & progress." icon={BarChart3} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Value" value={fc(t.totalValue)} accent="#8b5cf6" />
        <StatCard label="Spent" value={fc(t.totalSpent)} accent="#22c55e" />
        <StatCard label="Remaining" value={fc(t.wishlistValue)} accent="#06b6d4" />
        <StatCard label="Avg. Item Price" value={fc(t.avgPrice)} accent="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Cost by Category" description="Distribution of value across categories">
          {stats.byCategory.length ? (
            <DonutChart data={stats.byCategory.slice(0, 9).map((c) => ({ name: c.name, value: Math.round(c.value), color: c.color }))} valueFormatter={fc} centerFormatter={fcc} />
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Items by Status" description="Where everything sits in the pipeline">
          {stats.byStatus.length ? (
            <BarChartComp data={stats.byStatus.map((s) => ({ name: s.label, value: s.count, color: s.color }))} />
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Priority Breakdown" description="How your wants are prioritized">
          {stats.byPriority.length ? (
            <DonutChart data={stats.byPriority.map((p) => ({ name: p.label, value: p.count, color: p.color }))} />
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Price Distribution" description="Count of items per price band">
          <BarChartComp data={stats.priceDistribution.map((p) => ({ name: p.label, value: p.count }))} color="#06b6d4" />
        </ChartCard>

        <ChartCard title="Most Expensive Categories" description="Top categories by total value" className="lg:col-span-2">
          {stats.byCategory.length ? (
            <BarChartComp
              horizontal
              height={Math.max(240, stats.byCategory.slice(0, 10).length * 34)}
              data={stats.byCategory.slice(0, 10).map((c) => ({ name: c.name, value: Math.round(c.value), color: c.color }))}
              valueFormatter={fc}
            />
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Wishlist Growth" description="Cumulative items over time" className="lg:col-span-2">
          {stats.growthOverTime.length ? (
            <AreaChartComp
              data={stats.growthOverTime}
              keys={[
                { key: "cumulative", label: "Total items", color: "#8b5cf6" },
                { key: "acquired", label: "Acquired", color: "#22c55e" },
                { key: "added", label: "Added", color: "#06b6d4" },
              ]}
            />
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Monthly Spending" description="Estimated spend by month" className="lg:col-span-2">
          {stats.growthOverTime.some((g) => g.spending > 0) ? (
            <LineChartComp data={stats.growthOverTime} keys={[{ key: "spending", label: "Spending", color: "#f59e0b" }]} />
          ) : <Empty text="Mark items as acquired to see spending." />}
        </ChartCard>

        <ChartCard title="Category Value Treemap" description="Proportional value by category" className="lg:col-span-2">
          {stats.byCategory.length ? (
            <TreemapChart data={stats.byCategory.map((c) => ({ name: c.name, value: Math.round(c.value), color: c.color }))} valueFormatter={fc} />
          ) : <Empty />}
        </ChartCard>

        {stats.byRoom.length > 0 && (
          <ChartCard title="Value by Room" description="Investment per space">
            <BarChartComp horizontal data={stats.byRoom.map((r) => ({ name: r.name, value: Math.round(r.value), color: r.color }))} valueFormatter={fc} />
          </ChartCard>
        )}
        {stats.byCollection.length > 0 && (
          <ChartCard title="Value by Collection" description="Investment per collection">
            <BarChartComp horizontal data={stats.byCollection.map((c) => ({ name: c.name, value: Math.round(c.value), color: c.color }))} valueFormatter={fc} />
          </ChartCard>
        )}

        <ChartCard title="Acquired vs Remaining" description="Progress toward owning it all" className="lg:col-span-2">
          <BarChartComp
            data={stats.acquiredVsNot.map((a) => ({ name: a.label, value: a.count, color: a.label === "Acquired" ? "#22c55e" : "#8b5cf6" }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function Empty({ text = "No data yet" }: { text?: string }) {
  return <p className="py-16 text-center text-sm text-muted-foreground">{text}</p>;
}
