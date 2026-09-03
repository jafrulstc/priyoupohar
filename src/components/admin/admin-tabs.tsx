"use client";

/**
 * Composite tab sections for the redesigned admin shell.
 *
 * The top-level tab bar has exactly seven entries; each composite groups two
 * related management sections behind a small segmented control so all
 * existing functionality stays reachable without adding more top tabs:
 *   - Products  → Catalogue | Reviews moderation
 *   - Offers    → Offers & Banners | Spin Wheel
 *   - Settings  → General | Delivery Zones (locations)
 *
 * Each composite is a controlled shadcn Tabs instance — the overlay owns the
 * `value` so the command palette can deep-link into a sub-section.
 */

import type { ComponentType, ReactNode } from "react";
import { MapPin, Megaphone, Package, RotateCw, Settings, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AdminTabId } from "./admin-ui";
import ProductsPanel from "./products-panel";
import ReviewsPanel from "./reviews-panel";
import OffersPanel from "./offers-panel";
import SpinPanel from "./spin-panel";
import SettingsPanel from "./settings-panel";
import LocationsPanel from "./locations-panel";

function SubSection({
  value,
  onValueChange,
  options,
  children,
}: {
  value: AdminTabId;
  onValueChange: (v: AdminTabId) => void;
  options: { id: AdminTabId; label: string; icon: LucideIcon }[];
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <Tabs value={value} onValueChange={(v) => onValueChange(v as AdminTabId)}>
        <TabsList className="h-10 w-auto rounded-xl bg-muted/70 p-1">
          {options.map((opt) => (
            <TabsTrigger
              key={opt.id}
              value={opt.id}
              className={cn(
                "gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-bold",
                "data-[state=active]:bg-background data-[state=active]:shadow-sm"
              )}
            >
              <opt.icon className="h-3.5 w-3.5" aria-hidden />
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}

export function ProductsComposite({
  value,
  onValueChange,
}: {
  value: AdminTabId;
  onValueChange: (v: AdminTabId) => void;
}) {
  return (
    <SubSection
      value={value}
      onValueChange={onValueChange}
      options={[
        { id: "products", label: "Catalogue", icon: Package },
        { id: "reviews", label: "Reviews", icon: Star },
      ]}
    >
      {value === "reviews" ? <ReviewsPanel /> : <ProductsPanel />}
    </SubSection>
  );
}
export function OffersComposite({
  value,
  onValueChange,
}: {
  value: AdminTabId;
  onValueChange: (v: AdminTabId) => void;
}) {
  return (
    <SubSection
      value={value}
      onValueChange={onValueChange}
      options={[
        { id: "offers", label: "Offers & Banners", icon: Megaphone },
        { id: "spin", label: "Spin Wheel", icon: RotateCw },
      ]}
    >
      {value === "spin" ? <SpinPanel /> : <OffersPanel />}
    </SubSection>
  );
}

export function SettingsComposite({
  value,
  onValueChange,
}: {
  value: AdminTabId;
  onValueChange: (v: AdminTabId) => void;
}) {
  return (
    <SubSection
      value={value}
      onValueChange={onValueChange}
      options={[
        { id: "settings", label: "General", icon: Settings },
        { id: "locations", label: "Delivery Zones", icon: MapPin },
      ]}
    >
      {value === "locations" ? <LocationsPanel /> : <SettingsPanel />}
    </SubSection>
  );
}
