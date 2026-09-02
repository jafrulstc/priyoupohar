"use client";

/**
 * Categories panel — list + create / edit / delete categories.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  pyFetch,
  type AdminCategory,
  type AdminCategoryInput,
} from "@/lib/py-api";
import {
  categoryFormSchema,
  slugify,
  type CategoryFormValues,
} from "@/lib/admin-schemas";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Controller } from "react-hook-form";
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
  Field,
  PanelHeader,
  RowsSkeleton,
  Spinner,
  Td,
  Th,
} from "./admin-ui";

export default function CategoriesPanel() {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => pyFetch<AdminCategory[]>("/api/admin/categories", { token }),
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      pyFetch<{ ok: boolean }>(`/api/admin/categories/${id}`, { method: "DELETE", token }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`Category #${id} deleted`);
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not delete category");
      setDeleting(null);
    },
  });

  const items = categoriesQuery.data ?? [];
  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Categories"
        description="Group gifts into collections shoppers can browse."
        actions={
          <Button
            onClick={openCreate}
            className="gap-1.5 rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" aria-hidden /> New category
          </Button>
        }
      />

      {categoriesQuery.isError ? (
        <ErrorState
          message={
            categoriesQuery.error instanceof Error
              ? categoriesQuery.error.message
              : "Failed to load categories"
          }
          onRetry={() => categoriesQuery.refetch()}
        />
      ) : categoriesQuery.isLoading ? (
        <AdminTable>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <RowsSkeleton rows={4} cols={4} />
        </AdminTable>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first collection — Flowers, Cakes, Plants…"
          action={
            <Button onClick={openCreate} className="gap-1.5 rounded-xl bg-brand text-white hover:bg-rose-700">
              <Plus className="h-4 w-4" aria-hidden /> New category
            </Button>
          }
        />
      ) : (
        <AdminTable maxHeight="55vh">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Products</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-rose-50/40 dark:hover:bg-stone-800/50">
                <Td>
                  <div className="flex items-center gap-3">
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="h-9 w-9 rounded-lg border object-cover" />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-400 dark:bg-rose-950/60">
                        <FolderTree className="h-4 w-4" aria-hidden />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-bold">{c.name}</div>
                      {c.description && (
                        <div className="max-w-[260px] truncate text-xs text-muted-foreground">
                          {c.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Td>
                <Td className="font-mono text-xs text-muted-foreground">{c.slug}</Td>
                <Td className="text-muted-foreground">
                  <span title="Count not provided by the API">—</span>
                </Td>
                <Td>
                  {c.is_active ? (
                    <Badge className="rounded-full bg-emerald-100 font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full font-extrabold">
                      Hidden
                    </Badge>
                  )}
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => {
                        setEditing(c);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Products in this category will become uncategorised. This action cannot be undone.
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
              {deleteMutation.isPending ? "Deleting…" : "Delete category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit dialog                                                */
/* ------------------------------------------------------------------ */

function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminCategory | null;
}) {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          image_url: category.image_url ?? "",
          is_active: category.is_active,
        }
      : { name: "", slug: "", description: "", image_url: "", is_active: true },
  });

  // Re-sync the form each time the dialog opens or the target changes.
  useEffect(() => {
    if (open) {
      reset(
        category
          ? {
              name: category.name,
              slug: category.slug,
              description: category.description ?? "",
              image_url: category.image_url ?? "",
              is_active: category.is_active,
            }
          : { name: "", slug: "", description: "", image_url: "", is_active: true }
      );
    }
  }, [open, category, reset]);

  const mutation = useMutation({
    mutationFn: (payload: { id?: number; data: AdminCategoryInput }) =>
      payload.id
        ? pyFetch<AdminCategory>(`/api/admin/categories/${payload.id}`, {
            method: "PATCH",
            body: payload.data,
            token,
          })
        : pyFetch<AdminCategory>("/api/admin/categories", {
            method: "POST",
            body: payload.data,
            token,
          }),
    onSuccess: (saved, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(vars.id ? `Updated “${saved.name}”` : `Created “${saved.name}” 🎀`);
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save category"),
  });

  const onSubmit = (values: CategoryFormValues) => {
    mutation.mutate({
      id: category?.id,
      data: {
        name: values.name,
        slug: values.slug || slugify(values.name),
        description: values.description || null,
        image_url: values.image_url || null,
        is_active: values.is_active,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl scrollbar-slim sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">
            {category ? "Edit category" : "New category"}
          </DialogTitle>
          <DialogDescription>
            {category ? `Update “${category.name}”.` : "Group gifts into a browsable collection."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <Field label="Name" htmlFor="c-name" error={errors.name?.message}>
            <Input
              id="c-name"
              className="rounded-xl"
              placeholder="Fresh Flowers"
              {...register("name")}
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="c-slug"
            error={errors.slug?.message}
            hint="Leave blank to auto-generate from the name."
          >
            <Input
              id="c-slug"
              className="rounded-xl font-mono text-xs"
              placeholder="fresh-flowers"
              {...register("slug")}
            />
          </Field>

          <Field label="Description" htmlFor="c-desc" error={errors.description?.message}>
            <Textarea
              id="c-desc"
              rows={2}
              className="rounded-xl"
              placeholder="Hand-tied seasonal blooms…"
              {...register("description")}
            />
          </Field>

          <Field label="Image URL" htmlFor="c-image" error={errors.image_url?.message}>
            <Input
              id="c-image"
              className="rounded-xl font-mono text-xs"
              placeholder="https://… or /images/occasions/flowers.jpg"
              {...register("image_url")}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
            <span className="text-sm font-bold">Active</span>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} aria-label="Category active" />
              )}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700"
            >
              {mutation.isPending ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : category ? (
                "Save changes"
              ) : (
                "Create category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
