"use client";

/**
 * Task 2.5 admin editors — multi-image gallery + combo product builder.
 * Controlled components used inside ProductDialog (Task 2.5).
 */

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ImagePlus, PackagePlus, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  pyFetch,
  type AdminProduct,
  type UploadResponse,
} from "@/lib/py-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComboItemValues } from "@/lib/admin-schemas";

/* ---------------------------------------------------------------- */
/* Gallery                                                          */
/* ---------------------------------------------------------------- */

export function GalleryEditor({
  images,
  onChange,
  token,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  token: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);

  const add = (url: string) => {
    const clean = url.trim();
    if (!clean) return;
    if (images.length >= 8) {
      toast.error("Up to 8 gallery images");
      return;
    }
    if (images.includes(clean)) {
      toast.error("Image already added");
      return;
    }
    onChange([...images, clean]);
    setDraft("");
  };

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await pyFetch<UploadResponse>("/api/admin/upload", {
        method: "POST",
        formData: fd,
        token,
      });
      add(res.url);
      toast.success("Gallery image uploaded 📸");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted/30"
            >
              <img src={url} alt={`Gallery image ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove gallery image ${i + 1}`}
              >
                <Trash2 className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="Paste image URL and press Enter"
          className="rounded-xl font-mono text-xs"
          aria-label="Gallery image URL"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => add(draft)}
          disabled={!draft.trim()}
          className="shrink-0 gap-1 rounded-xl"
          aria-label="Add gallery image"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 gap-1 rounded-xl"
          aria-label="Upload gallery image"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <ImagePlus className="h-3.5 w-3.5" aria-hidden />}
          Upload
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Combo builder                                                    */
/* ---------------------------------------------------------------- */

export function ComboEditor({
  combo,
  onChange,
  products,
  selfId,
}: {
  combo: ComboItemValues[];
  onChange: (next: ComboItemValues[]) => void;
  products: AdminProduct[];
  selfId?: number;
}) {
  const update = (idx: number, patch: Partial<ComboItemValues>) => {
    onChange(combo.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    if (combo.length >= 8) {
      toast.error("Up to 8 combo items");
      return;
    }
    onChange([...combo, { product_id: 0, qty: 1 }]);
  };

  return (
    <div className="space-y-2">
      {combo.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Select
            value={item.product_id ? String(item.product_id) : ""}
            onValueChange={(v) => {
              const pid = Number(v);
              const product = products.find((p) => p.id === pid);
              update(idx, { product_id: pid, name: product?.name ?? "" });
            }}
          >
            <SelectTrigger className="min-w-0 flex-1 rounded-xl" aria-label={`Combo item ${idx + 1} product`}>
              <SelectValue placeholder="Pick a product…" />
            </SelectTrigger>
            <SelectContent>
              {products
                .filter((p) => p.id !== selfId)
                .map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            max={10}
            value={item.qty ?? 1}
            onChange={(e) => update(idx, { qty: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
            className="w-16 shrink-0 rounded-xl"
            aria-label={`Combo item ${idx + 1} quantity`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(combo.filter((_, i) => i !== idx))}
            className="h-9 w-9 shrink-0 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-stone-800"
            aria-label={`Remove combo item ${idx + 1}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="gap-1.5 rounded-xl"
        aria-label="Add combo item"
      >
        <PackagePlus className="h-3.5 w-3.5" aria-hidden /> Add combo item
      </Button>
    </div>
  );
}
