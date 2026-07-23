"use client";

import { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Star,
  Pin,
  ImageOff,
  Package,
  Plus,
  Car,
  Tag as TagIcon,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { ItemActions } from "@/components/items/item-actions";
import { ChartCard, LineChartComp } from "@/components/charts";
import { SimpleMarkdown } from "@/components/simple-markdown";
import { useItem, useSession, useAddPricePoint } from "@/hooks/queries";
import { formatCurrency, formatDate, totalItemCost, effectivePrice, potentialSavings } from "@/lib/utils";
import { useSettingsCurrency } from "@/hooks/use-currency";
import { toast } from "sonner";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: item, isLoading, isError } = useItem(id);
  const { data: session } = useSession();
  const currency = useSettingsCurrency();
  const addPrice = useAddPricePoint();
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [newPrice, setNewPrice] = useState("");

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (isError || !item) return notFound();

  const canEdit =
    session?.isAdmin || (session?.userId != null && item.user?.id === session.userId);
  const image = activeImg || item.imageUrl;
  const total = totalItemCost(item);
  const savings = potentialSavings(item);
  const history = (item.priceHistory ?? []).map((p) => ({
    month: formatDate(p.recordedAt),
    price: p.price,
  }));
  const lowest = item.priceHistory?.length ? Math.min(...item.priceHistory.map((p) => p.price)) : null;
  const highest = item.priceHistory?.length ? Math.max(...item.priceHistory.map((p) => p.price)) : null;

  const timeline = [
    { label: "Added", date: item.createdAt },
    { label: "Ordered", date: item.dateOrdered },
    { label: "Acquired", date: item.dateAcquired },
    { label: "Archived", date: item.dateArchived },
  ].filter((t) => t.date);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/items"><ArrowLeft className="h-4 w-4" /> Back to items</Link>
        </Button>
        <div className="flex items-center gap-2">
          {item.user && (
            <Link href={`/people/${item.user.username}`} className="mr-1 hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              @{item.user.username}
            </Link>
          )}
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/items/${item.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link>
            </Button>
          )}
          <ItemActions item={item} size="icon" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Media */}
        <div className="lg:col-span-2 space-y-3">
          <div className="glass relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted/40">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground/40">
                <ImageOff className="h-12 w-12" />
              </div>
            )}
            <div className="absolute right-3 top-3 flex gap-1.5">
              {item.pinned && <span className="rounded-full bg-background/80 p-1.5 backdrop-blur"><Pin className="h-4 w-4 fill-primary text-primary" /></span>}
              {item.favorite && <span className="rounded-full bg-background/80 p-1.5 backdrop-blur"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /></span>}
            </div>
          </div>
          {(item.gallery?.length ?? 0) > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {[item.imageUrl, ...item.gallery].filter(Boolean).map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(g!)}
                  className="aspect-square overflow-hidden rounded-lg border border-border/60 hover:border-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g!} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <PriorityBadge priority={item.priority} />
              {item.category && <Badge variant="muted">{item.category.name}</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h1>
            {(item.brand || item.model) && (
              <p className="mt-1 text-muted-foreground">
                {[item.brand, item.model].filter(Boolean).join(" · ")}
              </p>
            )}
            {item.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
          </div>

          {/* Price card */}
          <Card className="p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total cost</p>
                <p className="text-3xl font-bold">{total > 0 ? formatCurrency(total, currency) : "—"}</p>
                {savings > 0 && (
                  <p className="mt-0.5 text-sm font-medium text-emerald-500">
                    Save {formatCurrency(savings, currency)} vs MSRP
                  </p>
                )}
              </div>
              {item.url && (
                <Button asChild variant="gradient">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    View <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
            <div className="mt-3 divide-y divide-border/50">
              <Row label="MSRP" value={item.msrp ? formatCurrency(item.msrp, currency) : null} />
              <Row label="Current price" value={item.currentPrice ? formatCurrency(item.currentPrice, currency) : null} />
              <Row label="Discount price" value={item.discountPrice ? formatCurrency(item.discountPrice, currency) : null} />
              <Row label="Unit price" value={effectivePrice(item) ? formatCurrency(effectivePrice(item), currency) : null} />
              <Row label="Tax" value={item.taxEstimate ? formatCurrency(item.taxEstimate, currency) : null} />
              <Row label="Shipping" value={item.shippingEstimate ? formatCurrency(item.shippingEstimate, currency) : null} />
              <Row label="Quantity desired" value={item.quantityDesired} />
              {item.quantityOwned > 0 && <Row label="Quantity owned" value={item.quantityOwned} />}
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setPriceOpen(true)}>
                <Plus className="h-4 w-4" /> Record price change
              </Button>
            )}
          </Card>

          {/* Details grid */}
          <Card className="p-5">
            <div className="grid gap-x-6 sm:grid-cols-2">
              <div className="divide-y divide-border/50">
                <Row label="Store" value={item.store} />
                <Row label="Vendor" value={item.vendor} />
                <Row label="SKU" value={item.sku} />
                <Row label="Condition" value={item.condition} />
                <Row label="Color" value={item.color} />
              </div>
              <div className="divide-y divide-border/50">
                <Row label="Country" value={item.country} />
                <Row label="Serial number" value={item.serialNumber} />
                <Row label="Warranty until" value={item.warrantyUntil ? formatDate(item.warrantyUntil) : null} />
                <Row label="Subcategory" value={item.subcategory} />
                <Row label="SKU" value={undefined} />
              </div>
            </div>
            {item.customFields && item.customFields.length > 0 && (
              <div className="mt-4 border-t border-border/50 pt-3">
                <div className="grid gap-x-6 sm:grid-cols-2">
                  {item.customFields.map((f, i) => (
                    <Row key={i} label={f.label} value={f.value} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Vehicle */}
      {item.vehicle && (
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Car className="h-4 w-4" /> Vehicle details</h3>
          <div className="grid gap-x-6 sm:grid-cols-3">
            <div className="divide-y divide-border/50">
              <Row label="Type" value={item.vehicle.vehicleType} />
              <Row label="Make" value={item.vehicle.make} />
              <Row label="Model" value={item.vehicle.model} />
            </div>
            <div className="divide-y divide-border/50">
              <Row label="Year" value={item.vehicle.year} />
              <Row label="Trim" value={item.vehicle.trim} />
              <Row label="Mileage" value={item.vehicle.mileage?.toLocaleString()} />
            </div>
            <div className="divide-y divide-border/50">
              <Row label="Horsepower" value={item.vehicle.horsepower ? `${item.vehicle.horsepower} hp` : null} />
              <Row label="Target price" value={item.vehicle.targetPrice ? formatCurrency(item.vehicle.targetPrice, currency) : null} />
              <Row label="Ownership cost" value={item.vehicle.ownershipCost ? formatCurrency(item.vehicle.ownershipCost, currency) : null} />
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notes */}
        {item.notes && (
          <Card className="p-5 lg:col-span-2">
            <h3 className="mb-3 font-semibold">Notes</h3>
            <SimpleMarkdown source={item.notes} />
          </Card>
        )}

        {/* Timeline + tags */}
        <div className="space-y-4">
          {timeline.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4" /> Timeline</h3>
              <div className="space-y-3">
                {timeline.map((t) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="ml-auto text-sm text-muted-foreground">{formatDate(t.date)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {item.tags.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><TagIcon className="h-4 w-4" /> Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <Link key={t} href={`/items?tag=${encodeURIComponent(t)}`}>
                    <Badge variant="secondary">{t}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {(item.collections.length > 0 || item.rooms.length > 0) && (
            <Card className="p-5">
              <h3 className="mb-3 font-semibold">Belongs to</h3>
              <div className="flex flex-wrap gap-1.5">
                {item.collections.map((c) => (
                  <Link key={c.id} href={`/collections/${c.slug}`}><Badge>{c.name}</Badge></Link>
                ))}
                {item.rooms.map((r) => (
                  <Link key={r.id} href={`/rooms/${r.slug}`}><Badge variant="outline">{r.name}</Badge></Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Price history */}
      {history.length > 1 && (
        <ChartCard
          title="Price history"
          description={
            lowest != null && highest != null
              ? `Lowest ${formatCurrency(lowest, currency)} · Highest ${formatCurrency(highest, currency)}`
              : undefined
          }
        >
          <LineChartComp data={history} keys={[{ key: "price", label: "Price", color: "#8b5cf6" }]} />
        </ChartCard>
      )}

      {/* Related */}
      {item.relatedItems && item.relatedItems.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">Related items</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {item.relatedItems.map((r) => (
              <Link key={r.id} href={`/items/${r.slug}`} className="glass card-hover flex items-center gap-2 rounded-xl p-2.5">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </span>
                <span className="truncate text-sm font-medium">{r.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Record price dialog */}
      <Dialog open={priceOpen} onOpenChange={setPriceOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record price change</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>New price ({currency})</Label>
            <Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPriceOpen(false)}>Cancel</Button>
            <Button
              variant="gradient"
              disabled={addPrice.isPending || !newPrice}
              onClick={() =>
                addPrice.mutate(
                  { itemId: item.id, price: parseFloat(newPrice) },
                  {
                    onSuccess: () => {
                      toast.success("Price recorded");
                      setPriceOpen(false);
                      setNewPrice("");
                    },
                    onError: (e) => toast.error((e as Error).message),
                  }
                )
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
