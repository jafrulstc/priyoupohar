"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Star, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, pyFetch, type ProductReview, type ReviewStatus } from "@/lib/py-api";
import { useAdminStore } from "@/lib/admin-store";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminTable, EmptyState, ErrorState, PanelHeader,
  RowActions, RowsSkeleton, Td, Th, formatDateTime,
} from "./admin-ui";
import type { RowActionItem } from "./admin-ui";

const STATUS_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<ReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

export default function ReviewsPanel() {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [deleting, setDeleting] = useState<ProductReview | null>(null);

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);

  const query = useQuery({
    queryKey: ["admin", "reviews", statusFilter],
    queryFn: () => pyFetch<{ items: ProductReview[]; total: number }>(`/api/admin/reviews?${params}`, { token }),
    retry: 1,
  });

  const moderateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReviewStatus }) =>
      pyFetch<ProductReview>(`/api/admin/reviews/${id}`, { method: "PATCH", body: { status }, token }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Status update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => pyFetch(`/api/admin/reviews/${id}`, { method: "DELETE", token }),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }); toast.success(`Review #${id} deleted`); setDeleting(null); },
    onError: (err) => { toast.error(err instanceof ApiError ? err.message : "Delete failed"); setDeleting(null); },
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <div className="space-y-4">
      <PanelHeader title="Reviews" description={`${total} review${total === 1 ? "" : "s"} from customers.`} actions={
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewStatus | "all")}>
          <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      } />

      {query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Failed"} onRetry={() => query.refetch()} /> :
      query.isLoading ? <AdminTable><thead><tr><Th>Product</Th><Th>Author</Th><Th>Rating</Th><Th>Review</Th><Th>Status</Th><Th>Date</Th><Th className="text-right">Actions</Th></tr></thead><RowsSkeleton rows={5} cols={7} /></AdminTable> :
      items.length === 0 ? <EmptyState icon={Star} title="No reviews" description="Customer reviews will appear here." /> : (
        <AdminTable maxHeight="65dvh"><thead><tr><Th>Product</Th><Th>Author</Th><Th>Rating</Th><Th>Review</Th><Th>Status</Th><Th>Date</Th><Th className="text-right">Actions</Th></tr></thead><tbody>
          {items.map((r) => {
            const actions: RowActionItem[] = [];
            if (r.status !== "approved") {
              actions.push({ label: "Approve", icon: ThumbsUp, onSelect: () => moderateMut.mutate({ id: r.id, status: "approved" }) });
            }
            if (r.status !== "rejected") {
              actions.push({ label: "Reject", icon: ThumbsDown, onSelect: () => moderateMut.mutate({ id: r.id, status: "rejected" }) });
            }
            if (r.status !== "pending") {
              actions.push({ label: "Reset to pending", icon: RotateCcw, onSelect: () => moderateMut.mutate({ id: r.id, status: "pending" }) });
            }
            actions.push({ label: "Delete", icon: Trash2, danger: true, onSelect: () => setDeleting(r) });
            return (
            <tr key={r.id}>
              <Td className="text-xs font-bold text-muted-foreground">#{r.product_id}</Td>
              <Td><div className="font-bold">{r.name}</div>{r.city && <div className="text-xs text-muted-foreground">{r.city}</div>}</Td>
              <Td><div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}<span className="ml-1 text-xs tabular-nums">{r.rating}</span></div></Td>
              <Td><div className="max-w-[240px]"><div className="font-bold text-sm">{r.title ?? "No title"}</div><div className="max-w-[240px] truncate text-xs text-muted-foreground">{r.text}</div></div></Td>
              <Td><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS_BADGE[r.status]}`}>{STATUS_OPTIONS.find(s => s.value === r.status)?.label}</span></Td>
              <Td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(r.created_at)}</Td>
              <Td><RowActions label={`Actions for review #${r.id}`} items={actions} /></Td>
            </tr>
            );
          })}
        </tbody></AdminTable>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}><AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Delete this review?</AlertDialogTitle><AlertDialogDescription>Permanently remove this review. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 font-extrabold text-white hover:bg-rose-700" disabled={deleteMut.isPending} onClick={(e) => { e.preventDefault(); if (deleting) deleteMut.mutate(deleting.id); }}>{deleteMut.isPending ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}