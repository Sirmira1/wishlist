"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderHeart, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCollections, useCreateCollection, useSession } from "@/hooks/queries";
import { formatCurrency, totalItemCost, pct } from "@/lib/utils";
import { ACQUIRED_STATUSES } from "@/lib/constants";
import { useSettingsCurrency } from "@/hooks/use-currency";
import { toast } from "sonner";

function CreateCollectionDialog() {
  const create = useCreateCollection();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetBudget, setTargetBudget] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient"><Plus className="h-4 w-4" /> New Collection</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create collection</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dream Gaming Setup" autoFocus /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Target budget (optional)</Label><Input type="number" value={targetBudget} onChange={(e) => setTargetBudget(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="gradient"
            disabled={create.isPending || !name.trim()}
            onClick={() =>
              create.mutate(
                { name, description, targetBudget: targetBudget || null },
                {
                  onSuccess: () => { toast.success("Collection created"); setOpen(false); setName(""); setDescription(""); setTargetBudget(""); },
                  onError: (e) => toast.error((e as Error).message),
                }
              )
            }
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CollectionsPage() {
  const { data: collections, isLoading } = useCollections();
  const { data: session } = useSession();
  const currency = useSettingsCurrency();

  return (
    <div>
      <PageHeader title="Collections" description="Group items into curated sets — builds, upgrades, dream setups." icon={FolderHeart}>
        {session?.isAdmin && <CreateCollectionDialog />}
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : !collections?.length ? (
        <EmptyState icon={FolderHeart} title="No collections yet" description="Create your first collection to group related items together." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c, idx) => {
            const items = c.items ?? [];
            const acquired = items.filter((i) => ACQUIRED_STATUSES.has(i.status ?? "")).length;
            const value = items.reduce((s, i) => s + totalItemCost(i), 0);
            const progress = pct(acquired, items.length);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <Link href={`/collections/${c.slug}`}>
                  <Card className="card-hover overflow-hidden p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                        <FolderHeart className="h-5 w-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">{items.length} items</span>
                    </div>
                    <h3 className="mt-3 font-semibold">{c.name}</h3>
                    {c.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{c.description}</p>}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{progress}% acquired</span>
                        <span className="font-medium">{formatCurrency(value, currency)}</span>
                      </div>
                      <Progress value={progress} />
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
