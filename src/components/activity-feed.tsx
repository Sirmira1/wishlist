"use client";

import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  ArrowRightLeft,
  PartyPopper,
  FolderPlus,
  DoorOpen,
  Tag,
  Wallet,
  Upload,
  Settings as SettingsIcon,
  Activity as ActivityIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useActivity } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";

const ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  ITEM_ADDED: { icon: Plus, color: "#22c55e" },
  ITEM_UPDATED: { icon: Pencil, color: "#3b82f6" },
  ITEM_DELETED: { icon: Trash2, color: "#ef4444" },
  PRICE_UPDATED: { icon: DollarSign, color: "#f59e0b" },
  STATUS_CHANGED: { icon: ArrowRightLeft, color: "#8b5cf6" },
  ITEM_ACQUIRED: { icon: PartyPopper, color: "#10b981" },
  COLLECTION_CREATED: { icon: FolderPlus, color: "#ec4899" },
  COLLECTION_UPDATED: { icon: FolderPlus, color: "#ec4899" },
  ROOM_CREATED: { icon: DoorOpen, color: "#06b6d4" },
  ROOM_UPDATED: { icon: DoorOpen, color: "#06b6d4" },
  CATEGORY_CREATED: { icon: Tag, color: "#a855f7" },
  BUDGET_UPDATED: { icon: Wallet, color: "#14b8a6" },
  IMPORT: { icon: Upload, color: "#64748b" },
  SETTINGS_UPDATED: { icon: SettingsIcon, color: "#64748b" },
};

export function ActivityFeed({ limit = 12 }: { limit?: number }) {
  const { data, isLoading } = useActivity(limit);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No activity yet"
        description="Actions like adding items and price changes will show up here."
        className="py-10"
      />
    );
  }

  return (
    <ul className="space-y-1">
      {data.map((a) => {
        const meta = ICONS[a.type] ?? { icon: ActivityIcon, color: "#64748b" };
        const Icon = meta.icon;
        const inner = (
          <div className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{a.message}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
            </div>
          </div>
        );
        return (
          <li key={a.id}>
            {a.itemId ? <Link href={`/items/${a.itemId}`}>{inner}</Link> : inner}
          </li>
        );
      })}
    </ul>
  );
}
