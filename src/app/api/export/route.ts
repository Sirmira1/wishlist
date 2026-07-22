import Papa from "papaparse";
import { handle, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/auth";
import { totalItemCost, effectivePrice } from "@/lib/utils";
import { itemInclude } from "@/lib/items";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  if (!(await canView())) return fail("Public viewing is disabled.", 403);
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  const categoryId = searchParams.get("categoryId") || undefined;
  const collectionId = searchParams.get("collectionId") || undefined;

  const where = categoryId
    ? { categoryId }
    : collectionId
      ? { collections: { some: { id: collectionId } } }
      : {};

  const items = await prisma.item.findMany({ where, include: itemInclude, orderBy: { createdAt: "desc" } });

  if (format === "json") {
    return new Response(JSON.stringify(items, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="wishlist-export-${Date.now()}.json"`,
      },
    });
  }

  // CSV (and "excel" — CSV opens natively in Excel).
  const flat = items.map((i) => ({
    Title: i.title,
    Description: i.description ?? "",
    Category: i.category?.name ?? "",
    Subcategory: i.subcategory ?? "",
    Brand: i.brand ?? "",
    Model: i.model ?? "",
    Color: i.color ?? "",
    Condition: i.condition ?? "",
    Status: i.status,
    Priority: i.priority,
    Store: i.store ?? "",
    Vendor: i.vendor ?? "",
    URL: i.url ?? "",
    ImageURL: i.imageUrl ?? "",
    SKU: i.sku ?? "",
    MSRP: i.msrp ?? "",
    CurrentPrice: i.currentPrice ?? "",
    DiscountPrice: i.discountPrice ?? "",
    UnitPrice: effectivePrice(i),
    TaxEstimate: i.taxEstimate ?? "",
    ShippingEstimate: i.shippingEstimate ?? "",
    TotalCost: totalItemCost(i),
    QuantityDesired: i.quantityDesired,
    QuantityOwned: i.quantityOwned,
    Tags: i.tags.join("; "),
    Collections: i.collections.map((c) => c.name).join("; "),
    Rooms: i.rooms.map((r) => r.name).join("; "),
    Country: i.country ?? "",
    SerialNumber: i.serialNumber ?? "",
    DateAdded: i.createdAt.toISOString(),
    DateAcquired: i.dateAcquired?.toISOString() ?? "",
  }));

  const csv = Papa.unparse(flat);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="wishlist-export-${Date.now()}.csv"`,
    },
  });
});
