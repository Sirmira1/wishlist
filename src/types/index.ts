// Client-facing DTO types (JSON-serialized — dates are ISO strings).

export type CustomField = { label: string; value: string };

export interface TaxonomyRef {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  icon?: string | null;
}

export interface Vehicle {
  id: string;
  vehicleType: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  trim?: string | null;
  mileage?: number | null;
  horsepower?: number | null;
  targetPrice?: number | null;
  ownershipCost?: number | null;
}

export interface PricePoint {
  id: string;
  price: number;
  source?: string | null;
  note?: string | null;
  recordedAt: string;
}

export interface Item {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  notes?: string | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  condition?: string | null;
  tags: string[];
  subcategory?: string | null;
  priority: string;
  status: string;
  store?: string | null;
  vendor?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  gallery: string[];
  sku?: string | null;
  msrp?: number | null;
  currentPrice?: number | null;
  discountPrice?: number | null;
  taxEstimate?: number | null;
  shippingEstimate?: number | null;
  quantityDesired: number;
  quantityOwned: number;
  locationType?: string | null;
  country?: string | null;
  dateOrdered?: string | null;
  dateAcquired?: string | null;
  dateArchived?: string | null;
  serialNumber?: string | null;
  warrantyUntil?: string | null;
  favorite: boolean;
  pinned: boolean;
  isPcPart: boolean;
  pcPartType?: string | null;
  customFields?: CustomField[] | null;
  categoryId?: string | null;
  category?: TaxonomyRef | null;
  collections: TaxonomyRef[];
  rooms: TaxonomyRef[];
  vehicle?: Vehicle | null;
  priceHistory?: PricePoint[];
  relatedItems?: { id: string; title: string; slug: string; imageUrl?: string | null; status: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Category extends TaxonomyRef {
  description?: string | null;
  parentId?: string | null;
  _count?: { items: number };
}

export interface Collection extends TaxonomyRef {
  description?: string | null;
  coverImage?: string | null;
  targetBudget?: number | null;
  parentId?: string | null;
  _count?: { items: number; children: number };
  items?: Partial<Item>[];
}

export interface Room extends TaxonomyRef {
  description?: string | null;
  imageUrl?: string | null;
  _count?: { items: number };
  items?: Partial<Item>[];
}

export interface Budget {
  id: string;
  name: string;
  scope: string;
  period: string;
  amount: number;
  categoryId?: string | null;
  collectionId?: string | null;
  category?: Category | null;
  collection?: Collection | null;
  spent?: number;
  remaining?: number;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  itemId?: string | null;
  itemTitle?: string | null;
  createdAt: string;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Session {
  isAdmin: boolean;
  username: string | null;
  setupComplete: boolean;
  publicViewing: boolean;
  autoLogoutMinutes: number;
}
