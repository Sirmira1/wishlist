import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();
const optionalNumber = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "string" ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : null;
  });
const optionalInt = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "string" ? parseInt(v, 10) : Math.round(v);
    return Number.isFinite(n) ? n : null;
  });
const optionalDate = z
  .union([z.string(), z.date()])
  .optional()
  .nullable()
  .transform((v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  });

export const customFieldSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const vehicleSchema = z.object({
  vehicleType: z.string().default("CAR"),
  make: optionalString,
  model: optionalString,
  year: optionalInt,
  trim: optionalString,
  mileage: optionalInt,
  horsepower: optionalInt,
  targetPrice: optionalNumber,
  ownershipCost: optionalNumber,
});

export const itemInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalString,
  notes: optionalString,
  brand: optionalString,
  model: optionalString,
  color: optionalString,
  condition: optionalString,
  tags: z.array(z.string()).optional().default([]),
  subcategory: optionalString,
  priority: z.string().default("MEDIUM"),
  status: z.string().default("WISHLISTED"),
  store: optionalString,
  vendor: optionalString,
  url: optionalString,
  imageUrl: optionalString,
  gallery: z.array(z.string()).optional().default([]),
  sku: optionalString,
  msrp: optionalNumber,
  currentPrice: optionalNumber,
  discountPrice: optionalNumber,
  taxEstimate: optionalNumber,
  shippingEstimate: optionalNumber,
  quantityDesired: optionalInt,
  quantityOwned: optionalInt,
  locationType: optionalString,
  country: optionalString,
  dateOrdered: optionalDate,
  dateAcquired: optionalDate,
  dateArchived: optionalDate,
  serialNumber: optionalString,
  warrantyUntil: optionalDate,
  favorite: z.boolean().optional().default(false),
  pinned: z.boolean().optional().default(false),
  isPcPart: z.boolean().optional().default(false),
  pcPartType: optionalString,
  customFields: z.array(customFieldSchema).optional().default([]),
  categoryId: optionalString,
  collectionIds: z.array(z.string()).optional().default([]),
  roomIds: z.array(z.string()).optional().default([]),
  relatedItemIds: z.array(z.string()).optional().default([]),
  vehicle: vehicleSchema.optional().nullable(),
});

export type ItemInput = z.input<typeof itemInputSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: optionalString,
  color: optionalString,
  description: optionalString,
  parentId: optionalString,
});

export const collectionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: optionalString,
  icon: optionalString,
  color: optionalString,
  coverImage: optionalString,
  targetBudget: optionalNumber,
  parentId: optionalString,
  itemIds: z.array(z.string()).optional(),
});

export const roomSchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: optionalString,
  color: optionalString,
  description: optionalString,
  imageUrl: optionalString,
  itemIds: z.array(z.string()).optional(),
});

export const budgetSchema = z.object({
  name: z.string().trim().min(1).max(120),
  scope: z.enum(["GLOBAL", "CATEGORY", "COLLECTION"]).default("GLOBAL"),
  period: z.enum(["MONTHLY", "YEARLY", "TOTAL"]).default("MONTHLY"),
  amount: z.coerce.number().min(0),
  categoryId: optionalString,
  collectionId: optionalString,
});

export const priceHistorySchema = z.object({
  itemId: z.string(),
  price: z.coerce.number().min(0),
  source: optionalString,
  note: optionalString,
});

export const settingsSchema = z.object({
  adminUsername: z.string().trim().min(2).max(60).optional(),
  publicViewing: z.boolean().optional(),
  allowRegistration: z.boolean().optional(),
  autoLogoutMinutes: z.coerce.number().min(5).max(1440).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  accentColor: z.string().optional(),
  currency: z.string().optional(),
  monthlyBudget: optionalNumber,
  yearlyBudget: optionalNumber,
  savingsGoal: optionalNumber,
  savingsCurrent: optionalNumber,
});

export const setupSchema = z.object({
  username: z.string().trim().min(2, "Username too short").max(60),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username too short")
    .max(60)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, dots, dashes and underscores only"),
  displayName: z.string().trim().max(80).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const meSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Letters, numbers, dots, dashes and underscores only")
    .optional(),
  displayName: z.string().trim().max(80).optional().nullable(),
  monthlyBudget: optionalNumber,
  yearlyBudget: optionalNumber,
  savingsGoal: optionalNumber,
  savingsCurrent: optionalNumber,
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const resetPasswordSchema = z.object({
  username: z.string().trim().min(1),
  code: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(200),
});
