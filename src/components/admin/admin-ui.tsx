"use client";

/**
 * Shared primitives for the Bloom & Bliss admin panel.
 * Small, styled building blocks so every panel looks consistent.
 */

import type { ComponentType, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2, MoreVertical, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminOrderStatus } from "@/lib/py-api";

/* ------------------------------------------------------------------ */
/* Shared ids                                                          */
/* ------------------------------------------------------------------ */

export type AdminTabId =
  | "overview"
  | "products"
  | "categories"
  | "orders"
  | "users"
  | "settings"
  | "locations"
  | "offers"
  | "spin"
  | "reviews";

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
    <div className="rounded-2xl border bg-card p-3.5 shadow-soft transition-shadow hover:shadow-lift md:p-4">
      <div className="flex items-center gap-2 md:gap-2.5">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl md:h-9 md:w-9", TONE_CHIP[tone])}>
          <Icon className="h-4 w-4 md:h-4.5 md:w-4.5" aria-hidden />
        </span>
        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground md:text-xs">
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
  maxHeight = "60dvh",
}: {
  children: ReactNode;
  maxHeight?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
      <div className="scrollbar-slim overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full min-w-[640px] border-collapse text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/40">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 border-b border-border/70 bg-muted/80 px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground backdrop-blur first:pl-5 last:pr-5",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  onClick,
}: {
  children?: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
}) {
  return (
    <td
      onClick={onClick}
      className={cn("border-b border-border/60 px-4 py-3.5 align-middle first:pl-5 last:pr-5", className)}
    >
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------ */
/* Premium row actions (⋮ dropdown, Dashtrans style)                    */
/* ------------------------------------------------------------------ */

export type RowActionItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export function RowActions({
  items,
  label = "Row actions",
}: {
  items: RowActionItem[];
  label?: string;
}) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={label}
            className="h-8 w-8 rounded-full border-border/70 shadow-none hover:bg-muted"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.label}
              disabled={item.disabled}
              onClick={item.onSelect}
              className={cn(
                "gap-2.5 rounded-lg py-2 text-[13px] font-semibold",
                item.danger &&
                  "text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950/40 dark:focus:text-rose-300"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table pager ("Result 1–5 of 15" + Prev/Next, Dashtrans style)        */
/* ------------------------------------------------------------------ */

export function TablePager({
  offset,
  pageSize,
  total,
  fetching = false,
  onPrev,
  onNext,
}: {
  offset: number;
  pageSize: number;
  total: number;
  fetching?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
      <p className="text-muted-foreground">
        Result <span className="font-bold text-foreground">{from}–{to}</span> of{" "}
        <span className="font-bold text-foreground">{total}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 rounded-xl"
          disabled={offset === 0 || fetching}
          onClick={onPrev}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
        </Button>
        <Button
          size="sm"
          className="gap-1 rounded-xl bg-foreground font-bold text-background hover:bg-foreground/90"
          disabled={offset + pageSize >= total || fetching}
          onClick={onNext}
        >
          Next <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
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
