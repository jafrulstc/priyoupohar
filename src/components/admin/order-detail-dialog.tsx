"use client";

/**
 * Order detail dialog — items, shipping address, totals and the
 * admin status control (optimistic PATCH with rollback).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Package, ReceiptText, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import {
  ApiError,
  pyFetch,
  type AdminOrder,
  type AdminOrderStatus,
  type Paged,
} from "@/lib/py-api";
import { useAdminStore } from "@/lib/admin-store";
import { ORDER_STATUSES } from "@/lib/admin-schemas";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Spinner, StatusBadge, formatDateTime, ORDER_STATUS_META } from "./admin-ui";

export default function OrderDetailDialog({
  order,
  onOpenChange,
}: {
  order: AdminOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: AdminOrderStatus) =>
      pyFetch<AdminOrder>(`/api/admin/orders/${order!.id}`, {
        method: "PATCH",
        body: { status },
        token,
      }),
    onMutate: async (nextStatus) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "orders"] });
      const snapshot = queryClient.getQueriesData<Paged<AdminOrder>>({
        queryKey: ["admin", "orders"],
      });
      queryClient.setQueriesData<Paged<AdminOrder>>(
        { queryKey: ["admin", "orders"] },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((o) =>
                  o.id === order!.id ? { ...o, status: nextStatus } : o
                ),
              }
            : old
      );
      return snapshot;
    },
    onSuccess: (updated) => {
      toast.success(`Order ${updated.order_number} marked “${ORDER_STATUS_META[updated.status].label}” ✅`);
    },
    onError: (err, _status, snapshot) => {
      snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(err instanceof ApiError ? err.message : "Could not update order status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl scrollbar-slim sm:max-w-lg">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 font-mono text-base font-extrabold">
                {order.order_number}
                <StatusBadge status={order.status} />
              </DialogTitle>
              <DialogDescription>
                Placed {formatDateTime(order.created_at)} · updated {formatDateTime(order.updated_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Items */}
              <section aria-label="Order items" className="rounded-2xl border p-3">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  <Package className="h-3.5 w-3.5" aria-hidden /> Items
                </h4>
                <ul className="divide-y">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{item.product_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatINR(item.unit_price)} × {item.quantity}
                        </span>
                      </span>
                      <span className="font-extrabold tabular-nums">{formatINR(item.line_total)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Address */}
              <section aria-label="Shipping address" className="rounded-2xl border p-3 text-sm">
                <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> Deliver to
                </h4>
                <p className="font-bold">
                  {order.customer_name}
                  <span className="ml-2 font-normal text-muted-foreground">{order.customer_phone}</span>
                </p>
                {order.customer_email && (
                  <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                )}
                <p className="mt-1 text-muted-foreground">
                  {order.shipping_address}, {order.city} — <span className="font-mono">{order.pincode}</span>
                </p>
              </section>

              {/* Totals */}
              <section aria-label="Order totals" className="rounded-2xl border p-3 text-sm">
                <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  <ReceiptText className="h-3.5 w-3.5" aria-hidden /> Bill
                </h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Items</dt>
                    <dd className="tabular-nums">{formatINR(order.items_total)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="tabular-nums">
                      {order.delivery_fee === 0 ? "Free" : formatINR(order.delivery_fee)}
                    </dd>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Discount</dt>
                      <dd className="tabular-nums text-rose-600 dark:text-rose-400">
                        −{formatINR(order.discount)}
                      </dd>
                    </div>
                  )}
                  <Separator className="my-1.5" />
                  <div className="flex justify-between text-base">
                    <dt className="font-extrabold">Total</dt>
                    <dd className="font-extrabold tabular-nums">{formatINR(order.total)}</dd>
                  </div>
                </dl>
              </section>

              {/* Notes */}
              <section aria-label="Order notes" className="rounded-2xl border border-dashed p-3 text-sm">
                <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5" aria-hidden /> Notes
                </h4>
                <p className={order.notes ? "text-muted-foreground" : "text-muted-foreground/60 italic"}>
                  {order.notes || "No notes on this order."}
                </p>
              </section>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
                <Select
                  value={order.status}
                  onValueChange={(v) => statusMutation.mutate(v as AdminOrderStatus)}
                  disabled={statusMutation.isPending}
                >
                  <SelectTrigger
                    className="w-[170px] rounded-xl"
                    aria-label="Update order status"
                  >
                    {statusMutation.isPending ? (
                      <span className="flex items-center gap-2 text-sm">
                        <Spinner /> Updating…
                      </span>
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORDER_STATUS_META[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
