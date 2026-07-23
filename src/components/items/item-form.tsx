"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, X, Car, Star, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useCollections, useRooms, useCreateItem, useUpdateItem } from "@/hooks/queries";
import { STATUSES, PRIORITIES, CONDITIONS, LOCATION_TYPES, PC_PART_TYPES, VEHICLE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

type FormValues = {
  title: string;
  description: string;
  notes: string;
  brand: string;
  model: string;
  color: string;
  condition: string;
  subcategory: string;
  priority: string;
  status: string;
  categoryId: string;
  store: string;
  vendor: string;
  url: string;
  imageUrl: string;
  sku: string;
  serialNumber: string;
  country: string;
  locationType: string;
  msrp: string;
  currentPrice: string;
  discountPrice: string;
  taxEstimate: string;
  shippingEstimate: string;
  quantityDesired: string;
  quantityOwned: string;
  dateAcquired: string;
  dateOrdered: string;
  warrantyUntil: string;
  favorite: boolean;
  pinned: boolean;
  isPcPart: boolean;
  pcPartType: string;
  tags: string[];
  gallery: string[];
  collectionIds: string[];
  roomIds: string[];
  customFields: { label: string; value: string }[];
  isVehicle: boolean;
  vehicle: {
    vehicleType: string;
    make: string;
    model: string;
    year: string;
    trim: string;
    mileage: string;
    horsepower: string;
    targetPrice: string;
    ownershipCost: string;
  };
};

function toDefaults(item?: Item): FormValues {
  return {
    title: item?.title ?? "",
    description: item?.description ?? "",
    notes: item?.notes ?? "",
    brand: item?.brand ?? "",
    model: item?.model ?? "",
    color: item?.color ?? "",
    condition: item?.condition ?? "",
    subcategory: item?.subcategory ?? "",
    priority: item?.priority ?? "MEDIUM",
    status: item?.status ?? "WISHLISTED",
    categoryId: item?.categoryId ?? "",
    store: item?.store ?? "",
    vendor: item?.vendor ?? "",
    url: item?.url ?? "",
    imageUrl: item?.imageUrl ?? "",
    sku: item?.sku ?? "",
    serialNumber: item?.serialNumber ?? "",
    country: item?.country ?? "",
    locationType: item?.locationType ?? "",
    msrp: item?.msrp?.toString() ?? "",
    currentPrice: item?.currentPrice?.toString() ?? "",
    discountPrice: item?.discountPrice?.toString() ?? "",
    taxEstimate: item?.taxEstimate?.toString() ?? "",
    shippingEstimate: item?.shippingEstimate?.toString() ?? "",
    quantityDesired: item?.quantityDesired?.toString() ?? "1",
    quantityOwned: item?.quantityOwned?.toString() ?? "0",
    dateAcquired: item?.dateAcquired?.slice(0, 10) ?? "",
    dateOrdered: item?.dateOrdered?.slice(0, 10) ?? "",
    warrantyUntil: item?.warrantyUntil?.slice(0, 10) ?? "",
    favorite: item?.favorite ?? false,
    pinned: item?.pinned ?? false,
    isPcPart: item?.isPcPart ?? false,
    pcPartType: item?.pcPartType ?? "",
    tags: item?.tags ?? [],
    gallery: item?.gallery ?? [],
    collectionIds: item?.collections?.map((c) => c.id) ?? [],
    roomIds: item?.rooms?.map((r) => r.id) ?? [],
    customFields: item?.customFields ?? [],
    isVehicle: Boolean(item?.vehicle),
    vehicle: {
      vehicleType: item?.vehicle?.vehicleType ?? "CAR",
      make: item?.vehicle?.make ?? "",
      model: item?.vehicle?.model ?? "",
      year: item?.vehicle?.year?.toString() ?? "",
      trim: item?.vehicle?.trim ?? "",
      mileage: item?.vehicle?.mileage?.toString() ?? "",
      horsepower: item?.vehicle?.horsepower?.toString() ?? "",
      targetPrice: item?.vehicle?.targetPrice?.toString() ?? "",
      ownershipCost: item?.vehicle?.ownershipCost?.toString() ?? "",
    },
  };
}

export function ItemForm({ item }: { item?: Item }) {
  const router = useRouter();
  const { data: categories } = useCategories();
  const { data: collections } = useCollections();
  const { data: rooms } = useRooms();
  const create = useCreateItem();
  const update = useUpdateItem(item?.id ?? "");
  const [tagInput, setTagInput] = useState("");
  const [galleryInput, setGalleryInput] = useState("");

  const { register, handleSubmit, control, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: toDefaults(item),
  });
  const customFields = useFieldArray({ control, name: "customFields" });

  const tags = watch("tags");
  const gallery = watch("gallery");
  const isVehicle = watch("isVehicle");
  const isPcPart = watch("isPcPart");
  const collectionIds = watch("collectionIds");
  const roomIds = watch("roomIds");

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setValue("tags", [...tags, t]);
    setTagInput("");
  }
  function addGallery() {
    const g = galleryInput.trim();
    if (g && !gallery.includes(g)) setValue("gallery", [...gallery, g]);
    setGalleryInput("");
  }

  async function onSubmit(v: FormValues) {
    const payload = {
      ...v,
      msrp: v.msrp || null,
      currentPrice: v.currentPrice || null,
      discountPrice: v.discountPrice || null,
      taxEstimate: v.taxEstimate || null,
      shippingEstimate: v.shippingEstimate || null,
      quantityDesired: v.quantityDesired || 1,
      quantityOwned: v.quantityOwned || 0,
      categoryId: v.categoryId || null,
      dateAcquired: v.dateAcquired || null,
      dateOrdered: v.dateOrdered || null,
      warrantyUntil: v.warrantyUntil || null,
      pcPartType: v.isPcPart ? v.pcPartType || null : null,
      vehicle: v.isVehicle
        ? {
            vehicleType: v.vehicle.vehicleType,
            make: v.vehicle.make || null,
            model: v.vehicle.model || null,
            year: v.vehicle.year || null,
            trim: v.vehicle.trim || null,
            mileage: v.vehicle.mileage || null,
            horsepower: v.vehicle.horsepower || null,
            targetPrice: v.vehicle.targetPrice || null,
            ownershipCost: v.vehicle.ownershipCost || null,
          }
        : null,
    };

    try {
      if (item) {
        const updated = await update.mutateAsync(payload);
        toast.success("Item updated");
        router.push(`/items/${updated.slug}`);
      } else {
        const created = await create.mutateAsync(payload);
        toast.success("Item added to wishlist ✨");
        router.push(`/items/${created.slug}`);
      }
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message || "Something went wrong");
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basics">
        <TabsList className="flex-wrap">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="organize">Organize</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* BASICS */}
        <TabsContent value="basics">
          <Card className="space-y-5 p-5">
            <Field label="Title *">
              <Input {...register("title", { required: true })} placeholder="e.g. Herman Miller Aeron Chair" />
              {formState.errors.title && <p className="text-xs text-destructive">Title is required</p>}
            </Field>
            <Field label="Description">
              <Textarea {...register("description")} placeholder="Short summary of the item…" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Uncategorized" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Uncategorized</SelectItem>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Subcategory">
                <Input {...register("subcategory")} placeholder="Optional" />
              </Field>
              <Field label="Brand">
                <Input {...register("brand")} />
              </Field>
              <Field label="Model">
                <Input {...register("model")} />
              </Field>
              <Field label="Priority">
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Status">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Condition">
                <Controller
                  control={control}
                  name="condition"
                  render={({ field }) => (
                    <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {CONDITIONS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Color">
                <Input {...register("color")} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product URL">
                <Input {...register("url")} placeholder="https://…" />
              </Field>
              <Field label="Main image URL">
                <Input {...register("imageUrl")} placeholder="https://…" />
              </Field>
            </div>

            <Field label="Tags" hint="Press Enter to add">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary">
                    {t}
                    <button type="button" onClick={() => setValue("tags", tags.filter((x) => x !== t))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag…"
              />
            </Field>
          </Card>
        </TabsContent>

        {/* PRICING */}
        <TabsContent value="pricing">
          <Card className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="MSRP"><Input type="number" step="0.01" {...register("msrp")} /></Field>
              <Field label="Current Price"><Input type="number" step="0.01" {...register("currentPrice")} /></Field>
              <Field label="Discount Price"><Input type="number" step="0.01" {...register("discountPrice")} /></Field>
              <Field label="Tax Estimate"><Input type="number" step="0.01" {...register("taxEstimate")} /></Field>
              <Field label="Shipping Estimate"><Input type="number" step="0.01" {...register("shippingEstimate")} /></Field>
              <Field label="SKU"><Input {...register("sku")} /></Field>
              <Field label="Quantity Desired"><Input type="number" {...register("quantityDesired")} /></Field>
              <Field label="Quantity Owned"><Input type="number" {...register("quantityOwned")} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store"><Input {...register("store")} placeholder="e.g. Amazon, Best Buy" /></Field>
              <Field label="Vendor / Seller"><Input {...register("vendor")} /></Field>
              <Field label="Location Type">
                <Controller
                  control={control}
                  name="locationType"
                  render={({ field }) => (
                    <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {LOCATION_TYPES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Country"><Input {...register("country")} /></Field>
            </div>
          </Card>
        </TabsContent>

        {/* ORGANIZE */}
        <TabsContent value="organize">
          <Card className="space-y-5 p-5">
            <Field label="Collections">
              <div className="flex flex-wrap gap-2">
                {collections?.length ? collections.map((c) => {
                  const on = collectionIds.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setValue("collectionIds", on ? collectionIds.filter((x) => x !== c.id) : [...collectionIds, c.id])}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {c.name}
                    </button>
                  );
                }) : <p className="text-sm text-muted-foreground">No collections yet.</p>}
              </div>
            </Field>
            <Field label="Rooms">
              <div className="flex flex-wrap gap-2">
                {rooms?.length ? rooms.map((r) => {
                  const on = roomIds.includes(r.id);
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setValue("roomIds", on ? roomIds.filter((x) => x !== r.id) : [...roomIds, r.id])}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {r.name}
                    </button>
                  );
                }) : <p className="text-sm text-muted-foreground">No rooms yet.</p>}
              </div>
            </Field>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Controller control={control} name="favorite" render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Star className="h-4 w-4" /> Favorite
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Controller control={control} name="pinned" render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Pin className="h-4 w-4" /> Pinned
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Controller control={control} name="isPcPart" render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
                PC Part
              </label>
            </div>
            {isPcPart && (
              <Field label="PC Part Type">
                <Controller control={control} name="pcPartType" render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-56"><SelectValue placeholder="Select part" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {PC_PART_TYPES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )} />
              </Field>
            )}

            <Field label="Gallery images" hint="Add multiple image URLs">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {gallery.map((g) => (
                  <div key={g} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setValue("gallery", gallery.filter((x) => x !== g))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={galleryInput} onChange={(e) => setGalleryInput(e.target.value)} placeholder="https://…" />
                <Button type="button" variant="outline" onClick={addGallery}><Plus className="h-4 w-4" /></Button>
              </div>
            </Field>
          </Card>
        </TabsContent>

        {/* ADVANCED */}
        <TabsContent value="advanced">
          <Card className="space-y-5 p-5">
            <Field label="Notes (Markdown supported)">
              <Textarea {...register("notes")} className="min-h-[140px] font-mono text-sm" placeholder="- checklist item&#10;[link](https://…)&#10;**bold**" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date Ordered"><Input type="date" {...register("dateOrdered")} /></Field>
              <Field label="Date Acquired"><Input type="date" {...register("dateAcquired")} /></Field>
              <Field label="Warranty Until"><Input type="date" {...register("warrantyUntil")} /></Field>
              <Field label="Serial Number"><Input {...register("serialNumber")} /></Field>
            </div>

            {/* Vehicle */}
            <div className="rounded-xl border border-border/60 p-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Controller control={control} name="isVehicle" render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Car className="h-4 w-4" /> This is a vehicle
              </label>
              {isVehicle && (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Field label="Type">
                    <Controller control={control} name="vehicle.vehicleType" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPES.map((v) => (<SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    )} />
                  </Field>
                  <Field label="Make"><Input {...register("vehicle.make")} /></Field>
                  <Field label="Model"><Input {...register("vehicle.model")} /></Field>
                  <Field label="Year"><Input type="number" {...register("vehicle.year")} /></Field>
                  <Field label="Trim"><Input {...register("vehicle.trim")} /></Field>
                  <Field label="Mileage"><Input type="number" {...register("vehicle.mileage")} /></Field>
                  <Field label="Horsepower"><Input type="number" {...register("vehicle.horsepower")} /></Field>
                  <Field label="Target Price"><Input type="number" {...register("vehicle.targetPrice")} /></Field>
                  <Field label="Est. Ownership Cost"><Input type="number" {...register("vehicle.ownershipCost")} /></Field>
                </div>
              )}
            </div>

            {/* Custom fields */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Custom fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => customFields.append({ label: "", value: "" })}>
                  <Plus className="h-4 w-4" /> Add field
                </Button>
              </div>
              <div className="space-y-2">
                {customFields.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <Input placeholder="Label" {...register(`customFields.${i}.label`)} />
                    <Input placeholder="Value" {...register(`customFields.${i}.value`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => customFields.remove(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {customFields.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">Add unlimited custom fields — dimensions, warranty length, anything.</p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-20 z-10 flex items-center justify-end gap-2 rounded-xl glass-strong p-3 lg:bottom-4">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" variant="gradient" disabled={pending}>
          {pending ? "Saving…" : item ? "Save changes" : "Add to Wishlist"}
        </Button>
      </div>
    </form>
  );
}
