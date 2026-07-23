"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ShieldCheck, Package } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useUsers, useSession } from "@/hooks/queries";
import { initials } from "@/lib/utils";

export default function PeoplePage() {
  const { data: users, isLoading } = useUsers();
  const { data: session } = useSession();

  return (
    <div>
      <PageHeader title="People" description="Browse everyone’s wishlists. You can only edit your own." icon={Users} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : !users?.length ? (
        <EmptyState icon={Users} title="No one here yet" description="Be the first to start a wishlist." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u, idx) => {
            const name = u.displayName || u.username;
            const isYou = session?.userId === u.id;
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <Link href={`/people/${u.username}`}>
                  <Card className="card-hover flex items-center gap-4 p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {initials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate font-semibold">{name}</h3>
                        {u.role === "ADMIN" && <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />}
                        {isYou && <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">you</span>}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3.5 w-3.5" /> {u._count?.items ?? 0} items
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
