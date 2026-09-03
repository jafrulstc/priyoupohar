"use client";

import type { z } from "zod";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, pyFetch, type DeliveryLocation } from "@/lib/py-api";
import { locationFormSchema, type LocationFormValues } from "@/lib/admin-schemas";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminTable, EmptyState, ErrorState, Field, PanelHeader,
  RowActions, RowsSkeleton, Spinner, Td, Th,
} from "./admin-ui";
import { formatINR } from "@/lib/format";

function defaultsFor(loc: DeliveryLocation | null): LocationFormValues {
  return loc
    ? { pincode_prefix: loc.pincode_prefix, city: loc.city, state: loc.state, delivery_fee: loc.delivery_fee, free_above: loc.free_above, same_day: loc.same_day, midnight_available: loc.midnight_available, cod_available: loc.cod_available, eta_hours: loc.eta_hours, is_active: loc.is_active }
    : { pincode_prefix: "", city: "", state: "", delivery_fee: 99, free_above: null, same_day: false, midnight_available: false, cod_available: true, eta_hours: 48, is_active: true };
}

export default function LocationsPanel() {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryLocation | null>(null);
  const [deleting, setDeleting] = useState<DeliveryLocation | null>(null);

  const query = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: () => pyFetch<DeliveryLocation[]>("/api/admin/locations", { token }),
    retry: 1,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => pyFetch(`/api/admin/locations/${id}`, { method: "DELETE", token }),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin", "locations"] }); toast.success(`Location #${id} deleted`); setDeleting(null); },
    onError: (err) => { toast.error(err instanceof ApiError ? err.message : "Delete failed"); setDeleting(null); },
  });

  const items = query.data ?? [];

  return (
    <div className="space-y-4">
      <PanelHeader title="Delivery Locations" description={`${items.length} zone${items.length === 1 ? "" : "s"} configured.`} actions={
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5 rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700">
          <Plus className="h-4 w-4" /> Add location
        </Button>
      } />

      {query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Failed to load locations"} onRetry={() => query.refetch()} /> :
      query.isLoading ? <AdminTable><thead><tr><Th>Pincode</Th><Th>City</Th><Th>State</Th><Th>Fee</Th><Th>ETA</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead><RowsSkeleton rows={4} cols={7} /></AdminTable> :
      items.length === 0 ? <EmptyState icon={MapPin} title="No delivery zones" description="Add pincode prefixes to define delivery fees and ETA." action={
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5 rounded-xl bg-brand text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> Add location</Button>
      } /> : (
        <AdminTable maxHeight="60dvh"><thead><tr><Th>Pincode</Th><Th>City</Th><Th>State</Th><Th>Fee</Th><Th>ETA</Th><Th>Features</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead><tbody>
          {items.map((l) => (
            <tr key={l.id}>
              <Td className="font-mono text-xs font-bold">{l.pincode_prefix}***</Td>
              <Td className="font-bold">{l.city}</Td>
              <Td className="text-muted-foreground">{l.state}</Td>
              <Td className="tabular-nums">{formatINR(l.delivery_fee)}{l.free_above != null ? <span className="ml-1 text-xs text-muted-foreground">(free &gt;{formatINR(l.free_above)})</span> : null}</Td>
              <Td className="tabular-nums">{l.eta_hours}h</Td>
              <Td><div className="flex flex-wrap gap-1">{l.same_day && <Badge variant="secondary" className="text-[10px] rounded-full">Same-day</Badge>}{l.midnight_available && <Badge variant="secondary" className="text-[10px] rounded-full">Midnight</Badge>}{l.cod_available && <Badge variant="secondary" className="text-[10px] rounded-full">COD</Badge>}</div></Td>
              <Td>{l.is_active ? <Badge className="rounded-full bg-emerald-100 font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Active</Badge> : <Badge variant="secondary" className="rounded-full font-extrabold">Off</Badge>}</Td>
              <Td><RowActions
                label={`Actions for ${l.city}`}
                items={[
                  { label: "Edit zone", icon: Pencil, onSelect: () => { setEditing(l); setDialogOpen(true); } },
                  { label: "Delete", icon: Trash2, danger: true, onSelect: () => setDeleting(l) },
                ]}
              /></Td>
            </tr>
          ))}
        </tbody></AdminTable>
      )}

      <LocationDialog open={dialogOpen} onOpenChange={setDialogOpen} location={editing} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Delete zone &ldquo;{deleting?.city}&rdquo;?</AlertDialogTitle><AlertDialogDescription>Orders to this pincode prefix will fall back to default fees.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 font-extrabold text-white hover:bg-rose-700" disabled={deleteMut.isPending} onClick={(e) => { e.preventDefault(); if (deleting) deleteMut.mutate(deleting.id); }}>{deleteMut.isPending ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LocationDialog({ open, onOpenChange, location }: { open: boolean; onOpenChange: (o: boolean) => void; location: DeliveryLocation | null }) {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<z.input<typeof locationFormSchema>, unknown, LocationFormValues>({ resolver: zodResolver(locationFormSchema), defaultValues: defaultsFor(location) });

  const mut = useMutation({
    mutationFn: (p: { id?: number; data: LocationFormValues }) => p.id
      ? pyFetch<DeliveryLocation>(`/api/admin/locations/${p.id}`, { method: "PATCH", body: p.data, token })
      : pyFetch<DeliveryLocation>("/api/admin/locations", { method: "POST", body: p.data, token }),
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ["admin", "locations"] }); toast.success(v.id ? "Location updated" : "Location created"); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl scrollbar-slim sm:max-w-lg">
      <DialogHeader><DialogTitle className="text-lg font-extrabold">{location ? "Edit location" : "New location"}</DialogTitle><DialogDescription>{location ? `Update ${location.city} zone.` : "Add a delivery zone by pincode prefix."}</DialogDescription></DialogHeader>
      <form onSubmit={handleSubmit((d) => mut.mutate({ id: location?.id, data: d }))} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pincode Prefix" htmlFor="l-pin" error={errors.pincode_prefix?.message}><Input id="l-pin" className="rounded-xl font-mono" placeholder="110" maxLength={6} {...register("pincode_prefix")} /></Field>
          <Field label="ETA (hours)" htmlFor="l-eta" error={errors.eta_hours?.message}><Input id="l-eta" type="number" min={1} max={720} inputMode="numeric" className="rounded-xl" {...register("eta_hours", { valueAsNumber: true })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="l-city" error={errors.city?.message}><Input id="l-city" className="rounded-xl" {...register("city")} /></Field>
          <Field label="State" htmlFor="l-state" error={errors.state?.message}><Input id="l-state" className="rounded-xl" {...register("state")} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Delivery Fee (₹)" htmlFor="l-fee" error={errors.delivery_fee?.message}><Input id="l-fee" type="number" min={0} inputMode="numeric" className="rounded-xl" {...register("delivery_fee", { valueAsNumber: true })} /></Field>
          <Field label="Free Above (₹)" htmlFor="l-free" error={errors.free_above?.message}><Input id="l-free" type="number" min={0} inputMode="numeric" className="rounded-xl" placeholder="Optional" {...register("free_above", { valueAsNumber: true })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"><span className="text-xs font-bold">Same-day</span><Controller control={control} name="same_day" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /></div>
          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"><span className="text-xs font-bold">Midnight</span><Controller control={control} name="midnight_available" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /></div>
          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"><span className="text-xs font-bold">COD</span><Controller control={control} name="cod_available" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /></div>
        </div>
        <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"><span className="text-sm font-bold">Active</span><Controller control={control} name="is_active" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /></div>
        <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button><Button type="submit" disabled={mut.isPending} className="rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700">{mut.isPending ? <><Spinner /> Saving…</> : location ? "Save changes" : "Create location"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  );
}