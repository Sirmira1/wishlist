"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Pin, ImageOff, Tag } from "lucide-react";
import { StatusBadge, PriorityDot } from "@/components/badges";
import { ItemActions } from "./item-actions";
import { formatCurrency, totalItemCost, potentialSavings } from "@/lib/utils";
import type { Item } from "@/types";
import { useSettingsCurrency } from "@/hooks/use-currency";

export function ItemCard({ item, index = 0 }: { item: Item; index?: number }) {
  const currency = useSettingsCurrency();
  const total = totalItemCost(item);
  const savings = potentialSavings(item);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={`/items/${item.slug}`} className="group block">
        <div className="glass card-hover overflow-hidden rounded-2xl">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted/50">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <ImageOff className="h-10 w-10" />
              </div>
            )}
            <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
              <StatusBadge status={item.status} className="backdrop-blur-md" />
            </div>
            <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
              {item.pinned && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/70 backdrop-blur-md">
                  <Pin className="h-3.5 w-3.5 fill-primary text-primary" />
                </span>
              )}
              {item.favorite && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/70 backdrop-blur-md">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </span>
              )}
            </div>
            {savings > 0 && (
              <div className="absolute bottom-2.5 left-2.5 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                Save {formatCurrency(savings, currency)}
              </div>
            )}
          </div>

          <div className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <PriorityDot priority={item.priority} />
                  <h3 className="truncate font-semibold leading-tight">{item.title}</h3>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.brand ? `${item.brand} · ` : ""}
                  {item.category?.name ?? "Uncategorized"}
                </p>
              </div>
              <div onClick={(e) => e.preventDefault()}>
                <ItemActions item={item} />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-lg font-bold">{total > 0 ? formatCurrency(total, currency) : "—"}</p>
                {item.msrp && item.discountPrice && item.discountPrice < item.msrp && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(item.msrp, currency)}
                  </p>
                )}
              </div>
              {item.tags.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  <Tag className="h-3 w-3" /> {item.tags[0]}
                  {item.tags.length > 1 ? ` +${item.tags.length - 1}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
