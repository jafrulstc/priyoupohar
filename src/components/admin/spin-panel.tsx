"use client";

import type { z } from "zod";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, pyFetch, type SpinPrize, type SpinKind } from "@/lib/py-api";
import { spinPrizeFormSchema, type SpinPrizeFormValues } from "@/lib/admin-schemas";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminTable, EmptyState, ErrorState, Field, PanelHeader,
  RowActions, RowsSkeleton, Spinner, Td, Th,
} from "./admin-ui";
import { formatINR } from "@/lib/format";

const KIND_OPTIONS: { value: SpinKind; label: string }[] = [
  { value: "percent", label: "% Discount" },
  { value: "flat", label: "Flat ₹ Off" },
  { value: "freeship", label: "Free Shipping" },
  { value: "none", label: "No Prize" },
];

function defaultsFor(p: SpinPrize | null): SpinPrizeFormValues {
  return p
    ? { label: p.label, kind: p.kind, code: p.code, value: p.value, weight: p.weight, bg: p.bg ?? "", fg: p.fg ?? "", position: p.position, is_active: p.is_active }
    : { label: "", kind: "none", code: null, value: null, weight: 10, bg: "", fg: "", position: 0, is_active: true };
}

export default function SpinPanel() {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpinPrize | null>(null);
  const [deleting, setDeleting] = useState<SpinPrize | null>(null);

  const query = useQuery({ queryKey: ["admin", "spin-prizes"], queryFn: () => pyFetch<SpinPrize[]>("/api/admin/spin/prizes", { token }), retry: 1 });

  const deleteMut = useMutation({
    mutationFn: (id: number) => pyFetch(`/api/admin/spin/prizes/${id}`, { method: "DELETE", token }),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["admin", "spin-prizes"] }); toast.success(`Prize deleted`); setDeleting(null); },
    onError: (err) => { toast.error(err instanceof ApiError ? err.message : "Delete failed"); setDeleting(null); },
  });

  const items = query.data ?? [];
  const totalWeight = items.filter((p) => p.is_active).reduce((s, p) => s + p.weight, 0);

  return (
    <div className="space-y-4">
      <PanelHeader title="Spin Wheel Prizes" description={`${items.length} segment${items.length === 1 ? "" : "s"} · ${totalWeight} total active weight.`} actions={
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5 rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> Add prize</Button>
      } />
      {query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Failed"} onRetry={() => query.refetch()} /> :
      query.isLoading ? <AdminTable><thead><tr><Th>Pos</Th><Th>Label</Th><Th>Kind</Th><Th>Value</Th><Th>Code</Th><Th>Weight</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead><RowsSkeleton rows={6} cols={8} /></AdminTable> :
      items.length === 0 ? <EmptyState icon={RotateCw} title="No prizes configured" description="Add segments to the spin-to-win wheel." action={
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5 rounded-xl bg-brand text-white hover:bg-rose-700"><Plus className="h-4 w-4" /> Add prize</Button>
      } /> : (
        <AdminTable maxHeight="60dvh"><thead><tr><Th>Pos</Th><Th>Label</Th><Th>Kind</Th><Th>Value</Th><Th>Code</Th><Th>Weight</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead><tbody>
          {items.sort((a, b) => a.position - b.position).map((p) => (
            <tr key={p.id}>
              <Td className="tabular-nums font-bold">{p.position}</Td>
              <Td className="font-bold">{p.label}</Td>
              <Td><Badge variant="secondary" className="rounded-full text-[10px] font-extrabold">{KIND_OPTIONS.find(k => k.value === p.kind)?.label ?? p.kind}</Badge></Td>
              <Td className="tabular-nums">{p.kind === "percent" ? `${p.value ?? 0}%` : p.kind === "flat" ? formatINR(p.value ?? 0) : "—"}</Td>
              <Td className="font-mono text-xs">{p.code ?? "—"}</Td>
              <Td className="tabular-nums">{p.weight}</Td>
              <Td>{p.is_active ? <Badge className="rounded-full bg-emerald-100 font-extrabold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Active</Badge> : <Badge variant="secondary" className="rounded-full font-extrabold">Off</Badge>}</Td>
              <Td><RowActions
                label={`Actions for ${p.label}`}
                items={[
                  { label: "Edit prize", icon: Pencil, onSelect: () => { setEditing(p); setDialogOpen(true); } },
                  { label: "Delete", icon: Trash2, danger: true, onSelect: () => setDeleting(p) },
                ]}
              /></Td>
            </tr>
          ))}
        </tbody></AdminTable>
      )}
      <PrizeDialog open={dialogOpen} onOpenChange={setDialogOpen} prize={editing} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}><AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Delete &ldquo;{deleting?.label}&rdquo;?</AlertDialogTitle><AlertDialogDescription>Removing a prize segment may leave gaps on the wheel.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 font-extrabold text-white hover:bg-rose-700" disabled={deleteMut.isPending} onClick={(e) => { e.preventDefault(); if (deleting) deleteMut.mutate(deleting.id); }}>{deleteMut.isPending ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function PrizeDialog({ open, onOpenChange, prize }: { open: boolean; onOpenChange: (o: boolean) => void; prize: SpinPrize | null }) {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, formState: { errors }, setValue, watch } = useForm<z.input<typeof spinPrizeFormSchema>, unknown, SpinPrizeFormValues>({ resolver: zodResolver(spinPrizeFormSchema), defaultValues: defaultsFor(prize) });

  useEffect(() => { if (open) reset(defaultsFor(prize)); }, [open, prize, reset]);

  const kind = watch("kind");

  const mut = useMutation({
    mutationFn: (p: { id?: number; data: SpinPrizeFormValues }) => p.id
      ? pyFetch<SpinPrize>(`/api/admin/spin/prizes/${p.id}`, { method: "PATCH", body: p.data, token })
      : pyFetch<SpinPrize>("/api/admin/spin/prizes", { method: "POST", body: p.data, token }),
    onSuccess: (_, v) => { queryClient.invalidateQueries({ queryKey: ["admin", "spin-prizes"] }); toast.success(v.id ? "Prize updated" : "Prize created"); onOpenChange(false); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl scrollbar-slim sm:max-w-lg">
      <DialogHeader><DialogTitle className="text-lg font-extrabold">{prize ? "Edit prize" : "New prize"}</DialogTitle><DialogDescription>{prize ? `Update "${prize.label}".` : "Add a segment to the spin wheel."}</DialogDescription></DialogHeader>
      <form onSubmit={handleSubmit((d) => mut.mutate({ id: prize?.id, data: d }))} className="grid gap-4" noValidate>
        <Field label="Label" htmlFor="sp-label" error={errors.label?.message}><Input id="sp-label" className="rounded-xl" placeholder="15% Off" {...register("label")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kind" htmlFor="sp-kind" error={errors.kind?.message}>
            <Controller control={control} name="kind" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="sp-kind" className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{KIND_OPTIONS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </Field>
          {(kind === "percent" || kind === "flat") && (
            <Field label={kind === "percent" ? "Discount Value" : "Flat Amount (₹)"} htmlFor="sp-val" error={errors.value?.message}>
              <Input id="sp-val" type="number" min={0} inputMode="numeric" className="rounded-xl" {...register("value", { valueAsNumber: true })} />
            </Field>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coupon Code" htmlFor="sp-code" hint="Optional code for coupon kind"><Input id="sp-code" className="rounded-xl font-mono" placeholder="SPIN15" {...register("code")} /></Field>
          <Field label="Position" htmlFor="sp-pos" error={errors.position?.message}><Input id="sp-pos" type="number" min={0} inputMode="numeric" className="rounded-xl" {...register("position", { valueAsNumber: true })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Weight (0-100)" htmlFor="sp-wt" error={errors.weight?.message} hint="Probability weight"><Input id="sp-wt" type="number" min={0} max={100} inputMode="numeric" className="rounded-xl" {...register("weight", { valueAsNumber: true })} /></Field>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-xl border px-3 py-2.5"><span className="text-sm font-bold">Active</span><Controller control={control} name="is_active" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} /></div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="BG Color" htmlFor="sp-bg" hint="Tailwind bg class e.g. bg-rose-100"><Input id="sp-bg" className="rounded-xl" placeholder="bg-rose-100" {...register("bg")} /></Field>
          <Field label="FG Color" htmlFor="sp-fg" hint="Tailwind text class e.g. text-rose-700"><Input id="sp-fg" className="rounded-xl" placeholder="text-rose-700" {...register("fg")} /></Field>
        </div>
        <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button><Button type="submit" disabled={mut.isPending} className="rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700">{mut.isPending ? <><Spinner /> Saving…</> : prize ? "Save changes" : "Create prize"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  );
}