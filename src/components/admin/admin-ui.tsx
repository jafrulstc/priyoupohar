"use client";

/**
 * Shared primitives for the Bloom & Bliss admin panel.
 * Small, styled building blocks so every panel looks consistent.
 */

import type { ComponentType, ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { AdminOrderStatus } from "@/lib/py-api";

/* ------------------------------------------------------------------ */
/* Shared ids                                                          */
/* ------------------------------------------------------------------ */

export type AdminTabId = "overview" | "products" | "categories" | "orders" | "users";

/* ------------------------------------------------------------------ */
/* Spinner                                                             */
/* ------------------------------------------------------------------ */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden />;
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

export type StatTone = "brand" | "gold" | "mint" | "violet" | "amber" | "rose";

const TONE_CHIP: Record<StatTone, string> = {
  brand: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
  gold: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
  mint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  loading = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: StatTone;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex items-center gap-2.5">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", TONE_CHIP[tone])}>
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24 rounded-lg" />
      ) : (
        <p className="mt-2.5 truncate text-2xl font-extrabold tabular-nums text-foreground">
          {value}
        </p>
      )}
      {hint && !loading && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PanelHeader                                                         */
/* ------------------------------------------------------------------ */

export function PanelHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-extrabold tracking-tight text-foreground md:text-xl">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table helpers                                                       */
/* ------------------------------------------------------------------ */

export function AdminTable({
  children,
  maxHeight = "60vh",
}: {
  children: ReactNode;
  maxHeight?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="scrollbar-slim overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 border-b bg-muted/70 px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground backdrop-blur first:pl-4 last:pr-4",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={cn("border-b px-3 py-2.5 align-middle first:pl-4 last:pr-4", className)}>
      {children}
    </td>
  );
}

export function RowsSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <Td key={c}>
              <Skeleton
                className="h-5 rounded-md"
                style={{ width: `${55 + ((r * 7 + c * 13) % 35)}%` }}
              />
            </Td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/* ------------------------------------------------------------------ */
/* Empty / Error states                                                */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-400 dark:bg-rose-950/60 dark:text-rose-400">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm font-extrabold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-10 text-center dark:border-rose-900/60 dark:bg-rose-950/30"
    >
      <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">Something went wrong</p>
      <p className="max-w-md text-xs text-rose-600/90 dark:text-rose-400/90">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 gap-1.5 rounded-xl">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form field wrapper                                                  */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-bold text-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Order status meta (house palette — NO blue/indigo)                  */
/* ------------------------------------------------------------------ */

export const ORDER_STATUS_META: Record<
  AdminOrderStatus,
  { label: string; badge: string; dot: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  preparing: {
    label: "Preparing",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  shipped: {
    label: "Shipped",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({ status }: { status: AdminOrderStatus }) {
  const meta = ORDER_STATUS_META[status] ?? ORDER_STATUS_META.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold",
        meta.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatDateTime(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy, h:mm a");
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}
