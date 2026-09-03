"use client";

/**
 * Zod form schemas for the admin panel.
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password needs at least 6 characters"),
});
export type LoginValues = z.infer<typeof loginSchema>;

/* ------------------------------------------------------------------ */
/* Shared field helpers                                                */
/* ------------------------------------------------------------------ */

/** Empty string | undefined allowed; otherwise lowercase-kebab slug. */
const slugField = z
  .string()
  .trim()
  .max(80, "Keep slugs under 80 characters")
  .regex(/^$|^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only");

/** Accepts an absolute URL or a root-relative path like /images/x.jpg. */
const urlOrPathField = z
  .string()
  .trim()
  .max(600, "URL is too long")
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https?:\/\/\S+$/i.test(v),
    "Enter an https:// URL or a path starting with /"
  );

/** Number input that may be empty (→ null). Coerces NaN from valueAsNumber. */
const optionalAmount = z.preprocess(
  (v) =>
    v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))
      ? null
      : v,
  z
    .number({ message: "Enter a valid amount" })
    .min(0, "Can't be negative")
    .nullable()
);

/** Required number input (NaN from an empty valueAsNumber field → friendly message). */
const requiredAmount = (label: string) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? NaN : v),
    z.number({ message: `${label} is required` }).min(0, "Can't be negative")
  );

/* ------------------------------------------------------------------ */
/* Product                                                             */
/* ------------------------------------------------------------------ */

export const comboItemSchema = z.object({
  product_id: z.number({ message: "Pick a product" }).int().positive(),
  name: z.string().max(200).optional(),
  qty: z.preprocess(
    (v) => (v === "" || v === undefined ? 1 : v),
    z.number().int().min(1, "Min 1").max(10, "Max 10")
  ),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(120, "Name is too long"),
  slug: slugField,
  description: z.string().trim().max(2000, "Description is too long").optional(),
  price: requiredAmount("Price"),
  original_price: optionalAmount,
  category_id: z.number().int().nullable(),
  stock: z.preprocess(
    (v) => (v === "" || v === undefined ? NaN : v),
    z
      .number({ message: "Stock is required" })
      .int("Whole numbers only")
      .min(0, "Can't be negative")
  ),
  badge: z.string().trim().max(24, "Badge is too long").optional(),
  image_url: urlOrPathField,
  images: z.array(urlOrPathField).max(8, "Up to 8 gallery images").optional(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  is_combo: z.boolean().optional(),
  combo: z.array(comboItemSchema).max(8, "Up to 8 items").optional(),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ComboItemValues = z.infer<typeof comboItemSchema>;

/* ------------------------------------------------------------------ */
/* Category                                                            */
/* ------------------------------------------------------------------ */

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(80, "Name is too long"),
  slug: slugField,
  description: z.string().trim().max(500, "Description is too long").optional(),
  image_url: urlOrPathField,
  is_active: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES, {
  message: "Pick a valid order status",
});
export type OrderStatusValue = z.infer<typeof orderStatusSchema>;

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export const userUpdateSchema = z.object({
  role: z.enum(["admin", "customer"]).optional(),
  is_active: z.boolean().optional(),
});
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;

/* ------------------------------------------------------------------ */
/* Site Settings                                                       */
/* ------------------------------------------------------------------ */

export const settingsFormSchema = z.object({
  free_delivery_threshold: z.preprocess(
    (v) => (v === "" || v === undefined ? NaN : v),
    z.number({ message: "Enter a valid amount" }).min(0, "Can't be negative")
  ),
  delivery_fee: z.preprocess(
    (v) => (v === "" || v === undefined ? NaN : v),
    z.number({ message: "Enter a valid amount" }).min(0, "Can't be negative")
  ),
  cod_enabled: z.boolean(),
  support_phone: z.string().trim().max(30, "Too long"),
  support_email: z.string().trim().max(120, "Too long"),
  store_name: z.string().trim().min(1, "Store name is required").max(80, "Too long"),
  announcement_enabled: z.boolean(),
});
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

/* ------------------------------------------------------------------ */
/* Delivery Location                                                   */
/* ------------------------------------------------------------------ */

export const locationFormSchema = z.object({
  pincode_prefix: z.string().trim().min(1, "Required").max(6, "Max 6 digits"),
  city: z.string().trim().min(1, "Required").max(80, "Too long"),
  state: z.string().trim().min(1, "Required").max(80, "Too long"),
  delivery_fee: requiredAmount("Delivery fee"),
  free_above: optionalAmount,
  same_day: z.boolean(),
  midnight_available: z.boolean(),
  cod_available: z.boolean(),
  eta_hours: z.preprocess(
    (v) => (v === "" || v === undefined ? NaN : v),
    z.number({ message: "ETA hours is required" }).int().min(1, "Min 1 hour").max(720, "Max 720 hours")
  ),
  is_active: z.boolean(),
});
export type LocationFormValues = z.infer<typeof locationFormSchema>;

/* ------------------------------------------------------------------ */
/* Offers / Banners                                                    */
/* ------------------------------------------------------------------ */

export const offerFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160, "Too long"),
  message: z.string().trim().max(300, "Too long").optional(),
  icon: z.string().trim().max(30, "Too long").optional(),
  accent: z.boolean(),
  code: z.string().trim().max(40, "Too long").nullable(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  priority: z.preprocess(
    (v) => (v === "" || v === undefined ? 0 : v),
    z.number().int().min(0).max(9999)
  ),
  is_active: z.boolean(),
});
export type OfferFormValues = z.infer<typeof offerFormSchema>;

/* ------------------------------------------------------------------ */
/* Spin Prizes                                                         */
/* ------------------------------------------------------------------ */

export const spinPrizeFormSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40, "Too long"),
  kind: z.enum(["percent", "flat", "freeship", "none"]),
  code: z.string().trim().max(40, "Too long").nullable(),
  value: optionalAmount,
  weight: z.preprocess(
    (v) => (v === "" || v === undefined ? 10 : v),
    z.number().int().min(0, "0-100").max(100, "0-100")
  ),
  bg: z.string().trim().max(20, "Too long").optional(),
  fg: z.string().trim().max(20, "Too long").optional(),
  position: z.preprocess(
    (v) => (v === "" || v === undefined ? 0 : v),
    z.number().int().min(0)
  ),
  is_active: z.boolean(),
});
export type SpinPrizeFormValues = z.infer<typeof spinPrizeFormSchema>;

/** "Red Rose Bouquet" → "red-rose-bouquet" (slug suggestion helper). */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
