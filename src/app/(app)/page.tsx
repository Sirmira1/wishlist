"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  Wallet,
  CheckCircle2,
  Trophy,
  FolderHeart,
  DoorOpen,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Flame,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { ChartCard, DonutChart, BarChartComp, AreaChartComp } from "@/components/charts";
import { ActivityFeed } from "@/components/activity-feed";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { useStats, useSession } from "@/hooks/queries";
import { formatCurrency, formatCompact } from "@/lib/utils";

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats();
  const { data: session } = useSession();
  const currency = stats?.currency ?? "USD";

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const t = stats.totals;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" /> {session?.isAdmin ? `Welcome back, ${session.username}` : "Everything I want"}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-4xl">
              Your Life Wishlist
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Tracking <b className="text-foreground">{t.totalItems}</b> things worth{" "}
              <b className="text-foreground">{formatCurrency(t.totalValue, currency)}</b> across{" "}
              {t.totalCategories} categories, {t.totalCollections} collections and {t.totalRooms} rooms.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="gradient" size="sm">
                <Link href="/items">Browse items <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/analytics">View analytics</Link>
              </Button>
            </div>
          </div>

          {/* Completion ring */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - (t.completionPct / 100) * circumference }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{t.completionPct}%</span>
                <span className="text-[11px] text-muted-foreground">acquired</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Items" value={t.totalItems} icon={Package} sub={`${t.activeItems} active`} accent="#8b5cf6" delay={0.02} />
        <StatCard label="Wishlist Value" value={formatCurrency(t.wishlistValue, currency)} icon={Wallet} sub="still to acquire" accent="#06b6d4" delay={0.06} />
        <StatCard label="Total Spent" value={formatCurrency(t.totalSpent, currency)} icon={TrendingUp} sub={`${t.totalAcquired} acquired`} accent="#22c55e" delay={0.1} />
        <StatCard label="Potential Savings" value={formatCurrency(t.totalSavings, currency)} icon={Flame} sub="vs. MSRP" accent="#f59e0b" delay={0.14} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Acquired" value={t.totalAcquired} icon={CheckCircle2} accent="#10b981" />
        <StatCard label="Collections" value={t.totalCollections} icon={FolderHeart} accent="#ec4899" />
        <StatCard label="Rooms" value={t.totalRooms} icon={DoorOpen} accent="#0ea5e9" />
        <StatCard label="Avg. Price" value={formatCurrency(t.avgPrice, currency)} icon={Trophy} accent="#a855f7" />
      </div>

      {/* Budget progress */}
      {stats.prediction.monthlyBudget != null && (
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">This month’s budget</h3>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(stats.prediction.thisMonthSpend, currency)} /{" "}
              {formatCurrency(stats.prediction.monthlyBudget, currency)}
            </span>
          </div>
          <Progress value={(stats.prediction.thisMonthSpend / (stats.prediction.monthlyBudget || 1)) * 100} />
          {stats.prediction.completionDate && (
            <p className="mt-2 text-xs text-muted-foreground">
              At your current pace, you’ll complete your wishlist around{" "}
              <b className="text-foreground">
                {new Date(stats.prediction.completionDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </b>
              .
            </p>
          )}
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Cost by Category" description="Where the value lives" className="lg:col-span-1">
          {stats.byCategory.length ? (
            <DonutChart
              data={stats.byCategory.slice(0, 8).map((c) => ({ name: c.name, value: Math.round(c.value), color: c.color }))}
              valueFormatter={(v) => formatCurrency(v, currency)}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>
          )}
        </ChartCard>

        <ChartCard title="Items by Status" description="Progress across the pipeline" className="lg:col-span-2">
          {stats.byStatus.length ? (
            <BarChartComp data={stats.byStatus.map((s) => ({ name: s.label, value: s.count, color: s.color }))} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Wishlist Growth Over Time" description="Cumulative items & monthly spending">
        {stats.growthOverTime.length ? (
          <AreaChartComp
            data={stats.growthOverTime}
            keys={[
              { key: "cumulative", label: "Total items", color: "#8b5cf6" },
              { key: "acquired", label: "Acquired", color: "#22c55e" },
            ]}
          />
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Add items to see your growth curve.</p>
        )}
      </ChartCard>

      {/* Highest priority + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Highest Priority</h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/items?sort=priority">See all</Link>
            </Button>
          </div>
          {stats.highestPriority.length ? (
            <div className="space-y-1.5">
              {stats.highestPriority.map((i) => (
                <Link
                  key={i.id}
                  href={`/items/${i.slug}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                >
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {i.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{i.title}</span>
                  <PriorityBadge priority={i.priority} />
                  <StatusBadge status={i.status} className="hidden sm:inline-flex" />
                  <span className="w-20 shrink-0 text-right text-sm font-semibold">
                    {formatCurrency(i.price, currency)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing prioritized yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold">Latest Activity</h3>
          <ActivityFeed limit={8} />
        </Card>
      </div>
    </div>
  );
}
