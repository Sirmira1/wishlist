// ------------------------------------------------------------------
// Shared domain constants: statuses, priorities, categories, etc.
// Kept framework-agnostic so both server and client can import them.
// ------------------------------------------------------------------

export type StatusMeta = {
  value: string;
  label: string;
  color: string; // tailwind text/bg friendly hex
  group: "wishlist" | "progress" | "owned" | "closed";
};

export const STATUSES: StatusMeta[] = [
  { value: "DREAM", label: "Dream Item", color: "#a78bfa", group: "wishlist" },
  { value: "RESEARCHING", label: "Researching", color: "#60a5fa", group: "wishlist" },
  { value: "PLANNING", label: "Planning", color: "#38bdf8", group: "wishlist" },
  { value: "SAVING_FOR", label: "Saving For", color: "#22d3ee", group: "wishlist" },
  { value: "WAITING_FOR_SALE", label: "Waiting For Sale", color: "#2dd4bf", group: "wishlist" },
  { value: "WISHLISTED", label: "Wishlisted", color: "#818cf8", group: "wishlist" },
  { value: "READY_TO_BUY", label: "Ready To Buy", color: "#34d399", group: "progress" },
  { value: "ORDERED", label: "Ordered", color: "#fbbf24", group: "progress" },
  { value: "SHIPPED", label: "Shipped", color: "#f59e0b", group: "progress" },
  { value: "OUT_FOR_DELIVERY", label: "Out For Delivery", color: "#fb923c", group: "progress" },
  { value: "DELIVERED", label: "Delivered", color: "#84cc16", group: "progress" },
  { value: "ACQUIRED", label: "Acquired", color: "#22c55e", group: "owned" },
  { value: "INSTALLED", label: "Installed", color: "#16a34a", group: "owned" },
  { value: "BUILT", label: "Built", color: "#15803d", group: "owned" },
  { value: "COLLECTED", label: "Collected", color: "#10b981", group: "owned" },
  { value: "COMPLETED", label: "Completed", color: "#059669", group: "owned" },
  { value: "CANCELLED", label: "Cancelled", color: "#ef4444", group: "closed" },
  { value: "REMOVED", label: "Removed", color: "#f87171", group: "closed" },
  { value: "ARCHIVED", label: "Archived", color: "#94a3b8", group: "closed" },
];

/** Statuses that mean the item is owned / done. */
export const ACQUIRED_STATUSES = new Set([
  "ACQUIRED",
  "INSTALLED",
  "BUILT",
  "COLLECTED",
  "COMPLETED",
  "DELIVERED",
]);

export const CLOSED_STATUSES = new Set(["CANCELLED", "REMOVED", "ARCHIVED"]);

export function statusMeta(value: string): StatusMeta {
  return (
    STATUSES.find((s) => s.value === value) ?? {
      value,
      label: value,
      color: "#94a3b8",
      group: "wishlist",
    }
  );
}

export type PriorityMeta = { value: string; label: string; color: string; weight: number };

export const PRIORITIES: PriorityMeta[] = [
  { value: "CRITICAL", label: "Critical", color: "#ef4444", weight: 6 },
  { value: "VERY_HIGH", label: "Very High", color: "#f97316", weight: 5 },
  { value: "HIGH", label: "High", color: "#f59e0b", weight: 4 },
  { value: "MEDIUM", label: "Medium", color: "#3b82f6", weight: 3 },
  { value: "LOW", label: "Low", color: "#64748b", weight: 2 },
  { value: "SOMEDAY", label: "Someday", color: "#a855f7", weight: 1 },
  { value: "JUST_FOR_FUN", label: "Just For Fun", color: "#ec4899", weight: 0 },
];

export function priorityMeta(value: string): PriorityMeta {
  return (
    PRIORITIES.find((p) => p.value === value) ?? {
      value,
      label: value,
      color: "#64748b",
      weight: 3,
    }
  );
}

export const CONDITIONS = [
  "New",
  "Like New",
  "Open Box",
  "Refurbished",
  "Used - Good",
  "Used - Fair",
  "For Parts",
];

export const LOCATION_TYPES = [
  { value: "ONLINE", label: "Online" },
  { value: "PHYSICAL_STORE", label: "Physical Store" },
  { value: "MARKETPLACE", label: "Marketplace" },
];

export const PC_PART_TYPES = [
  "CPU",
  "GPU",
  "MOTHERBOARD",
  "RAM",
  "STORAGE",
  "CASE",
  "PSU",
  "COOLING",
  "FANS",
  "PERIPHERAL",
];

export const VEHICLE_TYPES = [
  { value: "CAR", label: "Car" },
  { value: "MOTORCYCLE", label: "Motorcycle" },
];

// Default categories seeded on first run. `icon` is a lucide-react icon name.
export const DEFAULT_CATEGORIES: {
  name: string;
  icon: string;
  color: string;
  parent?: string;
}[] = [
  { name: "PC Parts", icon: "Cpu", color: "#6366f1" },
  { name: "Entire PC Builds", icon: "Server", color: "#6366f1" },
  { name: "Furniture", icon: "Sofa", color: "#f59e0b" },
  { name: "Desks", icon: "Table", color: "#f59e0b", parent: "Furniture" },
  { name: "Chairs", icon: "Armchair", color: "#f59e0b", parent: "Furniture" },
  { name: "Mattresses", icon: "BedDouble", color: "#f59e0b", parent: "Furniture" },
  { name: "Bed Frames", icon: "Bed", color: "#f59e0b", parent: "Furniture" },
  { name: "Bedroom", icon: "Bed", color: "#ec4899" },
  { name: "Living Room", icon: "Tv2", color: "#ec4899" },
  { name: "Kitchen", icon: "CookingPot", color: "#ec4899" },
  { name: "Bathroom", icon: "Bath", color: "#ec4899" },
  { name: "Decor", icon: "Frame", color: "#ec4899" },
  { name: "Smart Home", icon: "Home", color: "#0ea5e9" },
  { name: "Lighting", icon: "Lightbulb", color: "#0ea5e9" },
  { name: "Technology", icon: "Laptop", color: "#3b82f6" },
  { name: "Phones", icon: "Smartphone", color: "#3b82f6", parent: "Technology" },
  { name: "Tablets", icon: "Tablet", color: "#3b82f6", parent: "Technology" },
  { name: "Laptops", icon: "Laptop", color: "#3b82f6", parent: "Technology" },
  { name: "Monitors", icon: "Monitor", color: "#3b82f6", parent: "Technology" },
  { name: "TVs", icon: "Tv", color: "#3b82f6", parent: "Technology" },
  { name: "Audio", icon: "Headphones", color: "#8b5cf6" },
  { name: "Gaming", icon: "Gamepad2", color: "#22c55e" },
  { name: "PlayStation", icon: "Gamepad2", color: "#22c55e", parent: "Gaming" },
  { name: "Xbox", icon: "Gamepad2", color: "#22c55e", parent: "Gaming" },
  { name: "Nintendo", icon: "Gamepad2", color: "#22c55e", parent: "Gaming" },
  { name: "PC Gaming", icon: "Gamepad2", color: "#22c55e", parent: "Gaming" },
  { name: "Accessories", icon: "Cable", color: "#14b8a6" },
  { name: "Tools", icon: "Wrench", color: "#f97316" },
  { name: "Vehicles", icon: "Car", color: "#ef4444" },
  { name: "Cars", icon: "Car", color: "#ef4444", parent: "Vehicles" },
  { name: "Motorcycles", icon: "Bike", color: "#ef4444", parent: "Vehicles" },
  { name: "Bicycles", icon: "Bike", color: "#ef4444", parent: "Vehicles" },
  { name: "Plants", icon: "Sprout", color: "#16a34a" },
  { name: "Figures", icon: "ToyBrick", color: "#a855f7" },
  { name: "Lego", icon: "ToyBrick", color: "#eab308" },
  { name: "Hot Wheels", icon: "Car", color: "#eab308" },
  { name: "Collectibles", icon: "Gem", color: "#a855f7" },
  { name: "Books", icon: "BookOpen", color: "#0891b2" },
  { name: "Manga", icon: "BookMarked", color: "#0891b2" },
  { name: "Clothing", icon: "Shirt", color: "#db2777" },
  { name: "Shoes", icon: "Footprints", color: "#db2777" },
  { name: "Watches", icon: "Watch", color: "#64748b" },
  { name: "Travel", icon: "Plane", color: "#0ea5e9" },
  { name: "Experiences", icon: "Sparkles", color: "#f43f5e" },
];

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "RSD", "JPY", "CHF", "SEK", "INR"];

export const ACCENT_COLORS = [
  { name: "violet", value: "262 83% 58%" },
  { name: "blue", value: "217 91% 60%" },
  { name: "emerald", value: "160 84% 39%" },
  { name: "rose", value: "347 77% 50%" },
  { name: "amber", value: "38 92% 50%" },
  { name: "cyan", value: "189 94% 43%" },
  { name: "fuchsia", value: "292 84% 61%" },
];

export const VIEW_MODES = [
  "gallery",
  "grid",
  "table",
  "list",
  "kanban",
  "timeline",
] as const;
export type ViewMode = (typeof VIEW_MODES)[number];
