"use client";

import type { z } from "zod";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, pyFetch, type Offer } from "@/lib/py-api";
import { offerFormSchema, type OfferFormValues } from "@/lib/admin-schemas";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AdminTable, EmptyState, ErrorState, Field, PanelHeader, RowActions, RowsSkeleton, Spinner, Td, Th, formatDate } from "./admin-ui";

function defaultsFor(o: Offer | null): OfferFormValues {
  return o ? { title: o.title, message: o.message ?? "", icon: o.icon ?? "", accent: o.accent, code: o.code, starts_at: o.starts_at ?? null, ends_at: o.ends_at ?? null, priority: o.priority, is_active: o.is_active } : { title: "", message: "", icon: "", accent: false, code: null, starts_at: null, ends_at: null, priority: 0, is_active: true };
}

export default function OffersPanel() {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState<Offer | null>(null);

  const query = useQuery({ queryKey: ["admin", "offers"], queryFn: () => pyFetch<Offer[]>("/api/admin/offers", { token }), retry: 1 });
  const deleteMut = useMutation({
    mutationFn: (id: number) => pyFetch(`/api/admin/offers/${id}`, { method: "DELETE", token }),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin", "offers"] }); toast.success(`Offer #${id} deleted`); setDeleting(null); },
    onError: (err) => { toast.error(err instanceof ApiError ? err.message : "Delete failed"); setDeleting(null); },
  });

  const items = query.data ?? [];
  const now = new Date();
  const isLive = (o: Offer) => o.is_active && (!o.starts_at || new Date(o.starts_at) <= now) && (!o.ends_at || new Date(o.ends_at) >= now);

  return (
    <div className="space-y-4">
      <PanelHeader title="Offers & Banners" description={`${items.length} offer${items.length === 1 ? "" : "s"}.`} actions={
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5 rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> New offer</Button>
      } />
      {query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Failed"} onRetry={() => query.refetch()} /> :
      query.isLoading ? <AdminTable><thead><tr><Th>Title</Th><Th>Code</Th><Th>Validity</Th><Th>Priority</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead><RowsSkeleton rows={4} cols={6} /></AdminTable> :
      items.length === 0 ? <EmptyState icon={Megaphone} title="No offers yet" description="Create announcements and promo codes for the storefront." action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5 rounded-xl bg-brand text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> New offer</Button>} /> : (
        <AdminTable maxHeight="60dvh"><thead><tr><Th>Title</Th><Th>Code</Th><Th>Validity</Th><Th>Priority</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead><tbody>
          {items.map((o) => (
            <tr key={o.id}>
              <Td><div className="font-bold">{o.title}</div>{o.message && <div className="max-w-[240px] truncate text-xs text-muted-foreground">{o.message}</div>}</Td>
              <Td className="font-mono text-xs">{o.code ?? "—"}</Td>
              <Td className="whitespace-nowrap text-xs text-muted-foreground">{o.starts_at ? formatDate(o.starts_at) : "—"}{o.ends_at ? ` → ${formatDate(o.ends_at)}` : ""}</Td>
              <Td className="tabular-nums">{o.priority}</Td>
              <Td>{isLive(o) ? <Badge className="rounded-full bg-emerald-100 font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Live</Badge> : o.is_active ? <Badge variant="secondary" className="rounded-full font-extrabold">Scheduled</Badge> : <Badge variant="secondary" className="rounded-full font-extrabold">Off</Badge>}</Td>
              <Td><RowActions
                label={`Actions for ${o.title}`}
                items={[
                  { label: "Edit offer", icon: Pencil, onSelect: () => { setEditing(o); setDialogOpen(true); } },
                  { label: "Delete", icon: Trash2, danger: true, onSelect: () => setDeleting(o) },
                ]}
              /></Td>
            </tr>
          ))}
        </tbody></AdminTable>
      )}
      <OfferDialog open={dialogOpen} onOpenChange={setDialogOpen} offer={editing} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}><AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Delete &ldquo;{deleting?.title}&rdquo;?</AlertDialogTitle><AlertDialogDescription>This removes the offer permanently.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 font-extrabold text-white hover:bg-rose-700" disabled={deleteMut.isPending} onClick={(e) => { e.preventDefault(); if (deleting) deleteMut.mutate(deleting.id); }}>{deleteMut.isPending ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function OfferDialog({ open, onOpenChange, offer }: { open: boolean; onOpenChange: (o: boolean) => void; offer: Offer | null }) {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<z.input<typeof offerFormSchema>, unknown, OfferFormValues>({ resolver: zodResolver(offerFormSchema), defaultValues: defaultsFor(offer) });

  useEffect(() => { if (open) reset(defaultsFor(offer)); }, [open, offer, reset]);

  const mut = useMutation({
    mutationFn: (p: { id?: number; data: OfferFormValues }) => p.id
      ? pyFetch<Offer>(`/api/admin/offers/${p.id}`, { method: "PATCH", body: p.data, token })
      : pyFetch<Offer>("/api/admin/offers", { method: "POST", body: p.data, token }),
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ["admin", "offers"] }); toast.success(v.id ? "Offer updated" : "Offer created"); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl scrollbar-slim sm:max-w-lg">
      <DialogHeader><DialogTitle className="text-lg font-extrabold">{offer ? "Edit offer" : "New offer"}</DialogTitle><DialogDescription>{offer ? `Update "${offer.title}".` : "Create a storefront announcement or promo."}</DialogDescription></DialogHeader>
      <form onSubmit={handleSubmit((d) => mut.mutate({ id: offer?.id, data: d }))} className="grid gap-4" noValidate>
        <Field label="Title" htmlFor="o-title" error={errors.title?.message}><Input id="o-title" className="rounded-xl" {...register("title")} /></Field>
        <Field label="Message" htmlFor="o-msg" error={errors.message?.message}><Textarea id="o-msg" rows={2} className="rounded-xl" {...register("message")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Icon Name" htmlFor="o-icon" hint="Lucide icon name e.g. Truck"><Input id="o-icon" className="rounded-xl" placeholder="Truck" {...register("icon")} /></Field>
          <Field label="Promo Code" htmlFor="o-code" hint="Optional coupon code"><Input id="o-code" className="rounded-xl font-mono" placeholder="BLISS10" {...register("code")} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts At" htmlFor="o-start"><Input id="o-start" type="datetime-local" className="rounded-xl" {...register("starts_at")} /></Field>
          <Field label="Ends At" htmlFor="o-end"><Input id="o-end" type="datetime-local" className="rounded-xl" {...register("ends_at")} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority" htmlFor="o-pri" error={errors.priority?.message}><Input id="o-pri" type="number" min={0} inputMode="numeric" className="rounded-xl" {...register("priority", { valueAsNumber: true })} /></Field>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"><span className="text-sm font-bold">Active</span><Controller control={control} name="is_active" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /></div>
            <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"><span className="text-sm font-bold">Accent style</span><Controller control={control} name="accent" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /></div>
          </div>
        </div>
        <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button><Button type="submit" disabled={mut.isPending} className="rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700">{mut.isPending ? <><Spinner /> Saving…</> : offer ? "Save changes" : "Create offer"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  );
}