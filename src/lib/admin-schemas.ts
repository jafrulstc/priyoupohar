"use client";

/**
 * Zod v4 form schemas for the admin panel — every admin form validates
 * through react-hook-form + @hookform/resolvers/zod using these schemas.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

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
  is_featured: z.boolean(),
  is_active: z.boolean(),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

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

/** "Red Rose Bouquet" → "red-rose-bouquet" (slug suggestion helper). */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
