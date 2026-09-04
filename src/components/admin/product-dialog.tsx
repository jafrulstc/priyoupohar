"use client";

/**
 * Create / Edit product dialog — react-hook-form + zod validation,
 * image upload to the FastAPI backend, category picker and switches.
 */

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, ImagePlus, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import {
  productFormSchema,
  slugify,
  type ComboItemValues,
  type ProductFormValues,
} from "@/lib/admin-schemas";
import {
  ApiError,
  pyFetch,
  type AdminCategory,
  type AdminProduct,
  type AdminProductInput,
  type Paged,
  type UploadResponse,
} from "@/lib/py-api";
import { useAdminStore } from "@/lib/admin-store";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComboEditor, GalleryEditor } from "./product-extras";
import { Field, Spinner } from "./admin-ui";

type FormInput = z.input<typeof productFormSchema>;

const BADGE_SUGGESTIONS = ["Bestseller", "New", "Premium", "Sale"];

function defaultsFor(product: AdminProduct | null): FormInput {
  return product
    ? {
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        price: product.price,
        original_price: product.original_price,
        category_id: product.category_id,
        stock: product.stock,
        badge: product.badge ?? "",
        image_url: product.image_url ?? "",
        images: product.images ?? [],
        is_featured: product.is_featured,
        is_active: product.is_active,
        is_combo: product.is_combo ?? false,
        combo: (product.combo ?? []).map((c) => ({
          product_id: c.product_id,
          name: c.name,
          qty: c.qty,
        })),
      }
    : {
        name: "",
        slug: "",
        description: "",
        price: undefined,
        original_price: null,
        category_id: null,
        stock: undefined,
        badge: "",
        image_url: "",
        images: [],
        is_featured: false,
        is_active: true,
        is_combo: false,
        combo: [],
      };
}

export default function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AdminProduct | null;
  categories: AdminCategory[];
}) {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<z.input<typeof productFormSchema>, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultsFor(product),
  });

  useEffect(() => {
    if (open) reset(defaultsFor(product));
  }, [open, product, reset]);

  const name = watch("name");
  const imageUrl = (watch("image_url") as string) ?? "";
  const galleryImages = (watch("images") as string[] | undefined) ?? [];
  const isCombo = !!watch("is_combo");
  const comboItems = (watch("combo") as ComboItemValues[] | undefined) ?? [];

  /* Catalogue for the combo product picker (Task 2.5). */
  const productsQuery = useQuery({
    queryKey: ["admin", "products", "combo-picker"],
    queryFn: () =>
      pyFetch<Paged<AdminProduct>>("/api/admin/products?limit=100", { token }),
    enabled: open && !!token,
    staleTime: 30_000,
  });
  const catalogue = productsQuery.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: (payload: { id?: number; data: AdminProductInput }) =>
      payload.id
        ? pyFetch<AdminProduct>(`/api/admin/products/${payload.id}`, {
            method: "PATCH",
            body: payload.data,
            token,
          })
        : pyFetch<AdminProduct>("/api/admin/products", {
            method: "POST",
            body: payload.data,
            token,
          }),
    onSuccess: (saved, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(vars.id ? `Updated “${saved.name}” ✨` : `Added “${saved.name}” 🌷`);
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save product"),
  });

  const onSubmit = (values: ProductFormValues) => {
    const data: AdminProductInput = {
      name: values.name,
      slug: values.slug || slugify(values.name),
      description: values.description ?? "",
      price: values.price,
      original_price: values.original_price ?? null,
      category_id: values.category_id ?? null,
      stock: values.stock,
      badge: values.badge || null,
      image_url: values.image_url || null,
      images: values.images ?? [],
      is_featured: values.is_featured,
      is_active: values.is_active,
      is_combo: !!values.is_combo,
      combo: (values.combo ?? [])
        .filter((c) => c.product_id > 0)
        .map((c) => ({ product_id: c.product_id, name: c.name ?? "", qty: c.qty })),
    };
    mutation.mutate({ id: product?.id, data });
  };

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await pyFetch<UploadResponse>("/api/admin/upload", {
        method: "POST",
        formData: fd,
        token,
      });
      setValue("image_url", res.url, { shouldValidate: true });
      toast.success("Image uploaded 📸");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl scrollbar-slim sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">
            {product ? `Edit product` : "New product"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? `Update details for “${product.name}”.`
              : "Add a fresh gift to the catalogue."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Name" htmlFor="p-name" error={errors.name?.message} className="sm:col-span-2">
            <Input id="p-name" className="rounded-xl" placeholder="Ruby Rose Bouquet" {...register("name")} />
          </Field>

          <Field
            label="Slug"
            htmlFor="p-slug"
            error={errors.slug?.message}
            hint="Leave blank to auto-generate from the name."
          >
            <div className="relative">
              <Input
                id="p-slug"
                className="rounded-xl pr-9 font-mono text-xs"
                placeholder={slugify(String(name ?? "")) || "auto-from-name"}
                {...register("slug")}
              />
              <Wand2
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          </Field>

          <Field label="Category" htmlFor="p-category" error={errors.category_id?.message}>
            <Controller
              control={control}
              name="category_id"
              render={({ field }) => (
                <Select
                  value={field.value == null ? "none" : String(field.value)}
                  onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                >
                  <SelectTrigger id="p-category" className="w-full rounded-xl">
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="p-desc"
            error={errors.description?.message}
            className="sm:col-span-2"
          >
            <Textarea
              id="p-desc"
              rows={3}
              className="rounded-xl"
              placeholder="Fresh roses hand-tied with love…"
              {...register("description")}
            />
          </Field>

          <Field label="Price (₹)" htmlFor="p-price" error={errors.price?.message}>
            <Input
              id="p-price"
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              className="rounded-xl"
              placeholder="499"
              {...register("price", { valueAsNumber: true })}
            />
          </Field>

          <Field label="Original price (₹)" htmlFor="p-mrp" error={errors.original_price?.message}>
            <Input
              id="p-mrp"
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              className="rounded-xl"
              placeholder="Optional — shows as MRP"
              {...register("original_price", { valueAsNumber: true })}
            />
          </Field>

          <Field label="Stock" htmlFor="p-stock" error={errors.stock?.message}>
            <Input
              id="p-stock"
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              className="rounded-xl"
              placeholder="20"
              {...register("stock", { valueAsNumber: true })}
            />
          </Field>

          <Field label="Badge" htmlFor="p-badge" error={errors.badge?.message}>
            <Input
              id="p-badge"
              list="p-badge-options"
              className="rounded-xl"
              placeholder="Bestseller / New / Premium"
              {...register("badge")}
            />
            <datalist id="p-badge-options">
              {BADGE_SUGGESTIONS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>

          <Field
            label="Image"
            htmlFor="p-image"
            error={errors.image_url?.message}
            className="sm:col-span-2"
            hint="Upload a file or paste an https:// URL / /images/… path."
          >
            <div className="flex items-center gap-2">
              <Input
                id="p-image"
                className="rounded-xl font-mono text-xs"
                placeholder="https://… (R2 CDN link or any image URL)"
                {...register("image_url")}
              />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="shrink-0 gap-1.5 rounded-xl"
                aria-label="Upload product image"
              >
                {uploading ? <Spinner /> : <ImagePlus className="h-4 w-4" aria-hidden />}
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
            {uploading && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Sending image to the server…
              </p>
            )}
            {imageUrl && (
              <div className="mt-1 flex items-center gap-2 rounded-xl border bg-muted/30 p-2">
                <img
                  src={resolveMediaUrl(imageUrl)}
                  alt="Product preview"
                  className="h-12 w-12 rounded-lg border object-cover"
                />
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
                  {imageUrl}
                </span>
              </div>
            )}
          </Field>

          <Field
            label="Gallery (extra images)"
            className="sm:col-span-2"
            hint="Shown as thumbnails on the product page — up to 8."
            error={errors.images?.message}
          >
            <GalleryEditor
              images={galleryImages}
              onChange={(next) => setValue("images", next, { shouldValidate: false })}
              token={token}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5 sm:col-span-2">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Gift className="h-4 w-4 text-brand dark:text-rose-400" aria-hidden />
              Combo product (bundle of multiple items)
            </span>
            <Controller
              control={control}
              name="is_combo"
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} aria-label="Combo product" />
              )}
            />
          </div>

          {isCombo && (
            <Field
              label="Combo contents"
              className="sm:col-span-2"
              error={errors.combo?.message}
              hint="Each bundled product and its quantity."
            >
              <ComboEditor
                combo={comboItems}
                onChange={(next) => setValue("combo", next, { shouldValidate: true })}
                products={catalogue}
                selfId={product?.id}
              />
            </Field>
          )}

          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
            <span className="text-sm font-bold">Featured</span>
            <Controller
              control={control}
              name="is_featured"
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} aria-label="Featured product" />
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
            <span className="text-sm font-bold">Active (visible in store)</span>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} aria-label="Product active" />
              )}
            />
          </div>

          <DialogFooter className="gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || uploading}
              className="rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700"
            >
              {mutation.isPending ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : product ? (
                "Save changes"
              ) : (
                "Create product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
