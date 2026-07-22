"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { totalItemCost, potentialSavings, pct } from "@/lib/utils";
import { ACQUIRED_STATUSES } from "@/lib/constants";
import type { ItemsResponse } from "@/types";

type Badge = { key: string; name: string; description: string; emoji: string; progress: number; goal: number };

export default function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["items", "achievements"],
    queryFn: () => api.get<ItemsResponse>("/api/items?pageSize=200"),
  });

  const items = data?.items ?? [];
  const acquired = items.filter((i) => ACQUIRED_STATUSES.has(i.status));
  const spent = acquired.reduce((s, i) => s + totalItemCost(i), 0);
  const savings = items.reduce((s, i) => s + potentialSavings(i), 0);
  const categoriesUsed = new Set(items.map((i) => i.categoryId).filter(Boolean)).size;
  const hasCar = acquired.some((i) => i.vehicle?.vehicleType === "CAR");
  const hasBuild = acquired.some((i) => i.status === "BUILT") || items.filter((i) => i.isPcPart).length >= 5;

  const badges: Badge[] = [
    { key: "first-item", name: "The Beginning", description: "Add your first item", emoji: "🌱", progress: Math.min(items.length, 1), goal: 1 },
    { key: "ten-items", name: "Collector", description: "Track 10 items", emoji: "📦", progress: Math.min(items.length, 10), goal: 10 },
    { key: "fifty-items", name: "Curator", description: "Track 50 items", emoji: "🗃️", progress: Math.min(items.length, 50), goal: 50 },
    { key: "hundred-items", name: "Archivist", description: "Track 100 items", emoji: "🏛️", progress: Math.min(items.length, 100), goal: 100 },
    { key: "first-acq", name: "First Acquisition", description: "Acquire your first item", emoji: "🎉", progress: Math.min(acquired.length, 1), goal: 1 },
    { key: "ten-acq", name: "Getting There", description: "Acquire 10 items", emoji: "✅", progress: Math.min(acquired.length, 10), goal: 10 },
    { key: "hundred-acq", name: "Century", description: "Acquire 100 items", emoji: "💯", progress: Math.min(acquired.length, 100), goal: 100 },
    { key: "first-car", name: "First Car", description: "Acquire your first vehicle", emoji: "🚗", progress: hasCar ? 1 : 0, goal: 1 },
    { key: "first-build", name: "First Custom PC", description: "Build a PC or track 5 parts", emoji: "🖥️", progress: hasBuild ? 1 : 0, goal: 1 },
    { key: "spender-1k", name: "Big Spender", description: "Spend $1,000", emoji: "💸", progress: Math.min(spent, 1000), goal: 1000 },
    { key: "spender-10k", name: "High Roller", description: "Spend $10,000", emoji: "💎", progress: Math.min(spent, 10000), goal: 10000 },
    { key: "bargain", name: "Bargain Hunter", description: "Save $500 vs MSRP", emoji: "🏷️", progress: Math.min(savings, 500), goal: 500 },
    { key: "diverse", name: "Renaissance", description: "Use 10 categories", emoji: "🎨", progress: Math.min(categoriesUsed, 10), goal: 10 },
  ];

  const unlocked = badges.filter((b) => b.progress >= b.goal).length;

  return (
    <div>
      <PageHeader title="Achievements" description="Milestones on your journey to owning everything you want." icon={Trophy} />

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <>
          <Card className="mb-6 flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Unlocked</p>
              <p className="text-3xl font-bold">{unlocked} / {badges.length}</p>
            </div>
            <div className="w-40">
              <Progress value={pct(unlocked, badges.length)} className="h-3" />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b, idx) => {
              const done = b.progress >= b.goal;
              return (
                <motion.div key={b.key} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}>
                  <Card className={`relative overflow-hidden p-5 ${done ? "" : "opacity-80"}`}>
                    {done && <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${done ? "bg-primary/15" : "bg-muted grayscale"}`}>
                        {done ? b.emoji : <Lock className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{b.name}</h3>
                        <p className="text-xs text-muted-foreground">{b.description}</p>
                      </div>
                    </div>
                    {!done && (
                      <div className="mt-3">
                        <Progress value={pct(b.progress, b.goal)} />
                        <p className="mt-1 text-right text-[11px] text-muted-foreground">
                          {Math.floor(b.progress).toLocaleString()} / {b.goal.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
