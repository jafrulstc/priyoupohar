"use client";

/**
 * Products panel — searchable, filterable, paginated catalogue table
 * with create / edit / delete via the ProductDialog.
 */

import { useState, useDeferredValue } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flower2, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import {
  ApiError,
  pyFetch,
  type AdminCategory,
  type AdminProduct,
  type Paged,
} from "@/lib/py-api";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminTable,
  EmptyState,
  ErrorState,
  PanelHeader,
  RowsSkeleton,
  RowActions,
  TablePager,
  Td,
  Th,
} from "./admin-ui";
import ProductDialog from "./product-dialog";

const PAGE_SIZE = 20;
type StatusFilter = "all" | "active" | "hidden";

export default function ProductsPanel() {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [offset, setOffset] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);

  const deferredQ = useDeferredValue(q);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => pyFetch<AdminCategory[]>("/api/admin/categories", { token }),
    retry: 1,
  });

  const params = new URLSearchParams();
  if (deferredQ.trim()) params.set("q", deferredQ.trim());
  if (categoryId !== "all") params.set("category_id", categoryId);
  if (status === "active") params.set("is_active", "true");
  if (status === "hidden") params.set("is_active", "false");
  params.set("limit", String(PAGE_SIZE));
  params.set("offset", String(offset));

  const productsQuery = useQuery({
    queryKey: ["admin", "products", deferredQ.trim(), categoryId, status, offset],
    queryFn: () => pyFetch<Paged<AdminProduct>>(`/api/admin/products?${params}`, { token }),
    retry: 1,
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      pyFetch<{ ok: boolean }>(`/api/admin/products/${id}`, { method: "DELETE", token }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`Product #${id} deleted`);
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not delete product");
      setDeleting(null);
    },
  });

  const items = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.total ?? 0;
  const categories = categoriesQuery.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"} in the catalogue.`}
        actions={
          <Button
            onClick={openCreate}
            className="gap-1.5 rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" aria-hidden /> New product
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder="Search products by name or slug…"
            aria-label="Search products"
            className="rounded-xl pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-[150px] rounded-xl" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as StatusFilter);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-[120px] rounded-xl" aria-label="Filter by visibility">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Live</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {productsQuery.isError ? (
        <ErrorState
          message={
            productsQuery.error instanceof Error ? productsQuery.error.message : "Failed to load products"
          }
          onRetry={() => productsQuery.refetch()}
        />
      ) : productsQuery.isLoading ? (
        <AdminTable>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <RowsSkeleton rows={6} cols={6} />
        </AdminTable>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products found"
          description={
            q || categoryId !== "all" || status !== "all"
              ? "Try clearing the search or filters."
              : "Add your first gift to get the catalogue blooming."
          }
          action={
            <Button onClick={openCreate} className="gap-1.5 rounded-xl bg-brand text-white hover:bg-rose-700">
              <Plus className="h-4 w-4" aria-hidden /> New product
            </Button>
          }
        />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg border object-cover"
                        />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-400 dark:bg-rose-950/60">
                          <Flower2 className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex max-w-[220px] items-center gap-1.5">
                          <span className="truncate font-bold">{p.name}</span>
                          {p.is_featured && (
                            <Star
                              className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                              aria-label="Featured"
                            />
                          )}
                          {p.is_combo && (
                            <span
                              className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                              title="Combo product"
                            >
                              Combo
                            </span>
                          )}
                        </div>
                        <div className="max-w-[220px] truncate font-mono text-[11px] text-muted-foreground">
                          {p.slug}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{p.category?.name ?? "—"}</Td>
                  <Td>
                    <div className="font-extrabold tabular-nums">{formatINR(p.price)}</div>
                    {p.original_price != null && p.original_price > p.price && (
                      <div className="text-xs text-muted-foreground line-through">
                        {formatINR(p.original_price)}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <span
                      className={
                        p.stock < 5
                          ? "font-extrabold tabular-nums text-rose-600 dark:text-rose-400"
                          : "tabular-nums text-foreground"
                      }
                    >
                      {p.stock}
                    </span>
                    {p.stock < 5 && <span className="ml-1 text-xs text-rose-500">low</span>}
                  </Td>
                  <Td>
                    {p.is_active ? (
                      <Badge className="rounded-full bg-emerald-100 font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full font-extrabold">
                        Hidden
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <RowActions
                      label={`Actions for ${p.name}`}
                      items={[
                        { label: "Edit product", icon: Pencil, onSelect: () => openEdit(p) },
                        {
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          onSelect: () => setDeleting(p),
                        },
                      ]}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          {/* Pagination */}
          <TablePager
            offset={offset}
            pageSize={PAGE_SIZE}
            total={total}
            fetching={productsQuery.isFetching}
            onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            onNext={() => setOffset((o) => o + PAGE_SIZE)}
          />
        </>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the product from the catalogue for good. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-600 font-extrabold text-white hover:bg-rose-700"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
