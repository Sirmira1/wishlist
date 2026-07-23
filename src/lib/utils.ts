import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compute the effective unit price of an item (discount → current → msrp). */
export function effectivePrice(item: {
  discountPrice?: number | null;
  currentPrice?: number | null;
  msrp?: number | null;
}): number {
  return item.discountPrice ?? item.currentPrice ?? item.msrp ?? 0;
}

/** Total cost of an item line = (unit + tax + shipping) * quantityDesired. */
export function totalItemCost(item: {
  discountPrice?: number | null;
  currentPrice?: number | null;
  msrp?: number | null;
  taxEstimate?: number | null;
  shippingEstimate?: number | null;
  quantityDesired?: number | null;
}): number {
  const unit = effectivePrice(item);
  const extras = (item.taxEstimate ?? 0) + (item.shippingEstimate ?? 0);
  const qty = item.quantityDesired ?? 1;
  return (unit + extras) * Math.max(1, qty);
}

/** Potential savings = msrp - effective price (never negative). */
export function potentialSavings(item: {
  discountPrice?: number | null;
  currentPrice?: number | null;
  msrp?: number | null;
}): number {
  const effective = effectivePrice(item);
  if (!item.msrp || !effective) return 0;
  return Math.max(0, item.msrp - effective);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  RSD: "дин",
  JPY: "¥",
  CHF: "CHF ",
  SEK: "kr ",
  INR: "₹",
};

export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  const n = value ?? 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  } catch {
    const sym = CURRENCY_SYMBOLS[currency] ?? "";
    return `${sym}${n.toLocaleString()}`;
  }
}

export function formatCompact(value: number | null | undefined): string {
  const n = value ?? 0;
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/**
 * Short currency for tight spaces (chart centres, stat tiles): CA$500.2M.
 * Below 10k the exact value still fits, so keep it readable there.
 */
export function formatCurrencyCompact(value: number | null | undefined, currency = "USD"): string {
  const n = value ?? 0;
  if (Math.abs(n) < 10_000) return formatCurrency(n, currency);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    const sym = CURRENCY_SYMBOLS[currency] ?? "";
    return `${sym}${formatCompact(n)}`;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Ensure slug uniqueness by suffixing a short random id when needed. */
export function uniqueSlug(input: string): string {
  const base = slugify(input) || "item";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return clamp(Math.round((part / whole) * 100), 0, 100);
}
