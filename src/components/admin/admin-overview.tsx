"use client";

/**
 * Overview panel — stat cards, quick actions and the latest orders.
 */

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Hourglass,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { pyFetch, type AdminOrder, type AdminStats, type Paged } from "@/lib/py-api";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import type { AdminTabId } from "./admin-ui";
import {
  AdminTable,
  EmptyState,
  ErrorState,
  PanelHeader,
  RowsSkeleton,
  StatCard,
  StatusBadge,
  Td,
  Th,
  formatDateTime,
} from "./admin-ui";

export default function AdminOverview({ onNavigate }: { onNavigate: (tab: AdminTabId) => void }) {
  const token = useAdminStore((s) => s.token);

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => pyFetch<AdminStats>("/api/admin/stats", { token }),
    retry: 1,
  });

  const recentQuery = useQuery({
    queryKey: ["admin", "orders", { scope: "recent" }],
    queryFn: () =>
      pyFetch<Paged<AdminOrder>>("/api/admin/orders?limit=6&offset=0", { token }),
    retry: 1,
  });

  const stats = statsQuery.data;
  const loadingStats = statsQuery.isLoading;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Overview"
        description="A quick pulse of the store — products, orders and revenue."
      />

      {statsQuery.isError ? (
        <ErrorState
          message={statsQuery.error instanceof Error ? statsQuery.error.message : "Failed to load stats"}
          onRetry={() => statsQuery.refetch()}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <StatCard
            label="Products"
            value={stats?.products ?? 0}
            icon={Package}
            tone="brand"
            loading={loadingStats}
            hint={stats ? `${stats.low_stock} low on stock` : undefined}
          />
          <StatCard
            label="Categories"
            value={stats?.categories ?? 0}
            icon={Tags}
            tone="violet"
            loading={loadingStats}
          />
          <StatCard
            label="Orders"
            value={stats?.orders ?? 0}
            icon={ShoppingBag}
            tone="mint"
            loading={loadingStats}
            hint={stats ? `${stats.pending_orders} awaiting action` : undefined}
          />
          <StatCard
            label="Customers"
            value={stats?.users ?? 0}
            icon={Users}
            tone="gold"
            loading={loadingStats}
          />
          <StatCard
            label="Revenue"
            value={stats ? formatINR(stats.revenue) : "—"}
            icon={IndianRupee}
            tone="brand"
            loading={loadingStats}
            hint="All-time order value"
          />
          <StatCard
            label="Pending"
            value={stats?.pending_orders ?? 0}
            icon={Hourglass}
            tone="amber"
            loading={loadingStats}
            hint="Confirm or cancel these"
          />
          <StatCard
            label="Low stock"
            value={stats?.low_stock ?? 0}
            icon={AlertTriangle}
            tone="rose"
            loading={loadingStats}
            hint="Restock soon"
          />
          <div className="col-span-2 flex flex-col justify-center gap-2 rounded-2xl border border-dashed p-4 md:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Quick actions
            </p>
            <Button
              size="sm"
              onClick={() => onNavigate("products")}
              className="justify-start gap-2 rounded-xl bg-brand font-bold text-white hover:bg-rose-700"
            >
              <Plus className="h-4 w-4" aria-hidden /> Manage products
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate("orders")}
              className="justify-start gap-2 rounded-xl font-bold"
            >
              <Clock3 className="h-4 w-4" aria-hidden /> Review pending orders
            </Button>
          </div>
        </div>
      )}

      {/* Recent orders */}
      <section aria-label="Recent orders">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
            Recent orders
          </h3>
          <Button variant="ghost" size="sm" className="gap-1 rounded-lg" onClick={() => onNavigate("orders")}>
            View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>

        {recentQuery.isError ? (
          <ErrorState
            message={recentQuery.error instanceof Error ? recentQuery.error.message : "Failed to load orders"}
            onRetry={() => recentQuery.refetch()}
          />
        ) : recentQuery.isLoading ? (
          <AdminTable maxHeight="320px">
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
              </tr>
            </thead>
            <RowsSkeleton rows={5} cols={6} />
          </AdminTable>
        ) : (recentQuery.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="Orders placed on the storefront will show up here."
          />
        ) : (
          <AdminTable maxHeight="320px">
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
              </tr>
            </thead>
            <tbody>
              {recentQuery.data!.items.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer transition-colors hover:bg-rose-50/50 dark:hover:bg-stone-800/60"
                  onClick={() => onNavigate("orders")}
                >
                  <Td className="font-mono text-xs font-bold text-brand dark:text-rose-400">
                    {order.order_number}
                  </Td>
                  <Td>
                    <div className="max-w-[180px] truncate font-bold">{order.customer_name}</div>
                    <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                      {order.customer_phone}
                    </div>
                  </Td>
                  <Td className="tabular-nums">{order.items.length}</Td>
                  <Td className="font-extrabold tabular-nums">{formatINR(order.total)}</Td>
                  <Td>
                    <StatusBadge status={order.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(order.created_at)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </section>
    </div>
  );
}
