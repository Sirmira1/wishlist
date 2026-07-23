"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DoorOpen, Plus } from "lucide-react";
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
import { useRooms, useCreateRoom, useSession } from "@/hooks/queries";
import { formatCurrency, totalItemCost, pct } from "@/lib/utils";
import { ACQUIRED_STATUSES } from "@/lib/constants";
import { useSettingsCurrency } from "@/hooks/use-currency";
import { toast } from "sonner";

function CreateRoomDialog() {
  const create = useCreateRoom();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient"><Plus className="h-4 w-4" /> New Room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create room</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gaming Room" autoFocus /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="gradient"
            disabled={create.isPending || !name.trim()}
            onClick={() =>
              create.mutate(
                { name, description },
                {
                  onSuccess: () => { toast.success("Room created"); setOpen(false); setName(""); setDescription(""); },
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

export default function RoomsPage() {
  const { data: rooms, isLoading } = useRooms();
  const { data: session } = useSession();
  const currency = useSettingsCurrency();

  return (
    <div>
      <PageHeader title="Rooms" description="Organize your acquisitions by space — plan whole rooms at a glance." icon={DoorOpen}>
        {session?.isAuthenticated && <CreateRoomDialog />}
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : !rooms?.length ? (
        <EmptyState icon={DoorOpen} title="No rooms yet" description="Create rooms like Bedroom, Office or Gaming Room to plan by space." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r, idx) => {
            const items = r.items ?? [];
            const acquired = items.filter((i) => ACQUIRED_STATUSES.has(i.status ?? "")).length;
            const value = items.reduce((s, i) => s + totalItemCost(i), 0);
            const progress = pct(acquired, items.length);
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <Link href={`/rooms/${r.slug}`}>
                  <Card className="card-hover overflow-hidden p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                        <DoorOpen className="h-5 w-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">{items.length} items</span>
                    </div>
                    <h3 className="mt-3 font-semibold">{r.name}</h3>
                    {r.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{r.description}</p>}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{progress}% complete</span>
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
