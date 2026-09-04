"use client";

/**
 * Orders panel — status filter, paginated order table and the
 * detail dialog (status changes live there).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw, ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/admin-schemas";
import { pyFetch, type AdminOrder, type Paged } from "@/lib/py-api";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminTable,
  EmptyState,
  ErrorState,
  PanelHeader,
  RowsSkeleton,
  RowActions,
  StatusBadge,
  TablePager,
  Td,
  Th,
  formatDateTime,
  ORDER_STATUS_META,
} from "./admin-ui";
import OrderDetailDialog from "./order-detail-dialog";

const PAGE_SIZE = 20;

export default function OrdersPanel() {
  const token = useAdminStore((s) => s.token);
  const [status, setStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  params.set("limit", String(PAGE_SIZE));
  params.set("offset", String(offset));

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", status, offset],
    queryFn: () => pyFetch<Paged<AdminOrder>>(`/api/admin/orders?${params}`, { token }),
    retry: 1,
    placeholderData: (prev) => prev,
  });

  const items = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.total ?? 0;

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Orders"
        description={`${total} order${total === 1 ? "" : "s"}${status === "all" ? "" : ` · ${ORDER_STATUS_META[status as keyof typeof ORDER_STATUS_META]?.label ?? status}`}.`}
        actions={
          <>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[160px] rounded-xl" aria-label="Filter orders by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ORDER_STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => ordersQuery.refetch()}
              aria-label="Refresh orders"
            >
              <RefreshCw className={ordersQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
            </Button>
          </>
        }
      />

      {ordersQuery.isError ? (
        <ErrorState
          message={
            ordersQuery.error instanceof Error ? ordersQuery.error.message : "Failed to load orders"
          }
          onRetry={() => ordersQuery.refetch()}
        />
      ) : ordersQuery.isLoading ? (
        <AdminTable>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Placed</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <RowsSkeleton rows={6} cols={7} />
        </AdminTable>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={status === "all" ? "No orders yet" : `No ${ORDER_STATUS_META[status as keyof typeof ORDER_STATUS_META]?.label.toLowerCase() ?? status} orders`}
          description="Storefront checkouts will appear here in real time."
        />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr
                  key={o.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open order ${o.order_number}`}
                  onClick={() => setSelected(o)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(o);
                    }
                  }}
                  className="cursor-pointer focus-visible:bg-muted/60"
                >
                  <Td className="font-mono text-xs font-bold text-brand dark:text-rose-400">
                    {o.order_number}
                  </Td>
                  <Td>
                    <div className="max-w-[200px] truncate font-bold">{o.customer_name}</div>
                    <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {o.customer_phone} · {o.city}
                    </div>
                  </Td>
                  <Td className="tabular-nums">{o.items.length}</Td>
                  <Td className="font-extrabold tabular-nums">{formatINR(o.total)}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(o.created_at)}
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      label={`Actions for ${o.order_number}`}
                      items={[
                        {
                          label: "View details",
                          icon: Eye,
                          onSelect: () => setSelected(o),
                        },
                      ]}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <TablePager
            offset={offset}
            pageSize={PAGE_SIZE}
            total={total}
            fetching={ordersQuery.isFetching}
            onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            onNext={() => setOffset((o) => o + PAGE_SIZE)}
          />
        </>
      )}

      <OrderDetailDialog order={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
