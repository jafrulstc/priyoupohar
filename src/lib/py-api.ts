/**
 * Bloom & Bliss — FastAPI admin backend client.
 *
 * The Python API runs on port 8000 behind the Caddy gateway. The ONLY way to
 * reach it is by appending `XTransformPort=8000` to a RELATIVE path — never
 * write an absolute URL or an explicit port anywhere.
 */

export const PY_PORT = 8000;

/** FastAPI error payload shape: {"detail": "..."} */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function pyUrl(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}XTransformPort=${PY_PORT}`;
}

type PyFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON body — serialised automatically. */
  body?: unknown;
  /** Bearer token for authenticated endpoints. */
  token?: string | null;
  /** Multipart upload — Content-Type must NOT be set manually. */
  formData?: FormData;
};

export async function pyFetch<T>(path: string, opts: PyFetchOptions = {}): Promise<T> {
  const { method = "GET", body, token, formData } = opts;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!formData && body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(pyUrl(path), {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Can't reach the admin server — is the FastAPI backend running?", 0);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { detail?: unknown };
      const detail = data?.detail;
      if (typeof detail === "string" && detail.trim()) message = detail;
      else if (detail != null) message = JSON.stringify(detail);
    } catch {
      /* non-JSON error body — keep the default message */
    }
    if (res.status === 401 && message === `Request failed (401)`) {
      message = "Session expired — please sign in again.";
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Domain types (backend contract)                                     */
/* ------------------------------------------------------------------ */

export type AdminRole = "admin" | "customer";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminCategoryInput = {
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
};

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  category_id: number | null;
  category: { id: number; name: string; slug: string } | null;
  image_url: string;
  images: string[];
  rating: number;
  review_count: number;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  badge: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminProductInput = {
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  category_id?: number | null;
  stock: number;
  badge?: string | null;
  image_url?: string | null;
  images?: string[];
  is_featured?: boolean;
  is_active?: boolean;
};

export type AdminOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type AdminOrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type AdminOrder = {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  city: string;
  pincode: string;
  items_total: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: AdminOrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: AdminOrderItem[];
};

export type AdminStats = {
  products: number;
  categories: number;
  orders: number;
  users: number;
  revenue: number;
  pending_orders: number;
  low_stock: number;
};

export type Paged<T> = { items: T[]; total: number };

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: AdminUser;
};

export type UploadResponse = { url: string; preview_url: string };
