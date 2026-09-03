"use client";

import type { z } from "zod";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { ApiError, pyFetch, type SiteSettings } from "@/lib/py-api";
import { settingsFormSchema, type SettingsFormValues } from "@/lib/admin-schemas";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelHeader, Field, Spinner, ErrorState } from "./admin-ui";
import { formatINR } from "@/lib/format";

export default function SettingsPanel() {
  const token = useAdminStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => pyFetch<SiteSettings>("/api/admin/settings", { token }),
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: (data: SettingsFormValues) =>
      pyFetch<SiteSettings>("/api/admin/settings", { method: "PATCH", body: data, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Settings saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save settings"),
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.input<typeof settingsFormSchema>, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
  });

  const settings = query.data;

  return (
    <div className="space-y-4">
      <PanelHeader title="Site Settings" description="Configure store-wide defaults and delivery fees." />

      {query.isError ? (
        <ErrorState message={query.error instanceof Error ? query.error.message : "Failed to load settings"} onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="max-w-xl space-y-4">
          <Field label="Store Name" htmlFor="s-name" error={errors.store_name?.message}>
            <Input id="s-name" className="rounded-xl" {...register("store_name", { value: settings?.store_name ?? "" })} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Free Delivery Threshold (₹)" htmlFor="s-threshold" error={errors.free_delivery_threshold?.message}>
              <Input id="s-threshold" type="number" min={0} step="1" inputMode="numeric" className="rounded-xl" placeholder="999" {...register("free_delivery_threshold", { valueAsNumber: true, value: settings?.free_delivery_threshold })} />
            </Field>
            <Field label="Delivery Fee (₹)" htmlFor="s-fee" error={errors.delivery_fee?.message}>
              <Input id="s-fee" type="number" min={0} step="1" inputMode="numeric" className="rounded-xl" placeholder="99" {...register("delivery_fee", { valueAsNumber: true, value: settings?.delivery_fee })} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support Phone" htmlFor="s-phone" error={errors.support_phone?.message}>
              <Input id="s-phone" className="rounded-xl" placeholder="+91 98765 43210" {...register("support_phone", { value: settings?.support_phone ?? "" })} />
            </Field>
            <Field label="Support Email" htmlFor="s-email" error={errors.support_email?.message}>
              <Input id="s-email" type="email" className="rounded-xl" placeholder="help@bloombliss.in" {...register("support_email", { value: settings?.support_email ?? "" })} />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
            <span className="text-sm font-bold">Cash on Delivery</span>
            <Controller control={control} name="cod_enabled" defaultValue={settings?.cod_enabled ?? true} render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
          </div>

          <div className="flex items-center justify-between rounded-xl border px-3 py-2.5">
            <span className="text-sm font-bold">Show Announcement Bar</span>
            <Controller control={control} name="announcement_enabled" defaultValue={settings?.announcement_enabled ?? true} render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="gap-1.5 rounded-xl bg-brand font-extrabold text-white hover:bg-rose-700">
            {mutation.isPending ? <Spinner /> : <Save className="h-4 w-4" />}
            {mutation.isPending ? "Saving…" : "Save settings"}
          </Button>
        </form>
      )}
    </div>
  );
}