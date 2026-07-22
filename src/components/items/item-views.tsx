"use client";

import Link from "next/link";
import { ImageOff, Star, Pin } from "lucide-react";
import { ItemCard } from "./item-card";
import { ItemActions } from "./item-actions";
import { StatusBadge, PriorityBadge, PriorityDot } from "@/components/badges";
import { formatCurrency, totalItemCost, formatDate } from "@/lib/utils";
import { STATUSES } from "@/lib/constants";
import { useSettingsCurrency } from "@/hooks/use-currency";
import type { Item } from "@/types";

function Thumb({ item, className = "h-10 w-10" }: { item: Item; className?: string }) {
  return item.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.imageUrl} alt="" className={`${className} rounded-md object-cover`} loading="lazy" />
  ) : (
    <span className={`${className} flex items-center justify-center rounded-md bg-muted text-muted-foreground/50`}>
      <ImageOff className="h-4 w-4" />
    </span>
  );
}

export function GalleryView({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, i) => (
        <ItemCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}

export function ListView({ items }: { items: Item[] }) {
  const currency = useSettingsCurrency();
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/items/${item.slug}`}
          className="glass card-hover flex items-center gap-3 rounded-xl p-2.5"
        >
          <Thumb item={item} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <PriorityDot priority={item.priority} />
              <p className="truncate font-medium">{item.title}</p>
              {item.favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {item.brand ? `${item.brand} · ` : ""}
              {item.category?.name ?? "Uncategorized"}
            </p>
          </div>
          <StatusBadge status={item.status} className="hidden sm:inline-flex" />
          <p className="w-24 shrink-0 text-right font-semibold">
            {totalItemCost(item) > 0 ? formatCurrency(totalItemCost(item), currency) : "—"}
          </p>
          <div onClick={(e) => e.preventDefault()}>
            <ItemActions item={item} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function TableView({ items }: { items: Item[] }) {
  const currency = useSettingsCurrency();
  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/40 transition-colors hover:bg-accent/40">
                <td className="px-4 py-2.5">
                  <Link href={`/items/${item.slug}`} className="flex items-center gap-2.5">
                    <Thumb item={item} />
                    <span className="font-medium">{item.title}</span>
                    {item.pinned && <Pin className="h-3 w-3 fill-primary text-primary" />}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{item.category?.name ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <PriorityBadge priority={item.priority} />
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-2.5 text-right font-semibold">
                  {totalItemCost(item) > 0 ? formatCurrency(totalItemCost(item), currency) : "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatDate(item.createdAt)}</td>
                <td className="px-4 py-2.5 text-right" onClick={(e) => e.preventDefault()}>
                  <ItemActions item={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function KanbanView({ items }: { items: Item[] }) {
  const currency = useSettingsCurrency();
  // Only render status columns that contain items, in canonical order.
  const columns = STATUSES.filter((s) => items.some((i) => i.status === s.value));
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colItems = items.filter((i) => i.status === col.value);
        return (
          <div key={col.value} className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                {col.label}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {colItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {colItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.slug}`}
                  className="glass card-hover block rounded-xl p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Thumb item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(totalItemCost(item), currency)}
                      </p>
                    </div>
                    <PriorityDot priority={item.priority} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TimelineView({ items }: { items: Item[] }) {
  const currency = useSettingsCurrency();
  const groups = new Map<string, Item[]>();
  for (const item of [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))) {
    const key = new Date(item.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([month, monthItems]) => (
        <div key={month} className="relative pl-6">
          <div className="absolute left-0 top-1 h-full w-px bg-border" />
          <div className="absolute -left-1 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{month}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {monthItems.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.slug}`}
                className="glass card-hover flex items-center gap-3 rounded-xl p-2.5"
              >
                <Thumb item={item} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(totalItemCost(item), currency)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
