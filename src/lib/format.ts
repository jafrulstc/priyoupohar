export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const discountPct = (price: number, mrp?: number) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

/* "3 Sept 2026" — compact, human-readable review/order dates */
export const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* "1 review" / "5 reviews" — gramatically correct counts.
   opts.noun customizes the word: ({ noun: "happy review" }) → "1 happy review" */
export const reviewLabel = (n: number, opts?: { noun?: string }) => {
  const base = opts?.noun ?? "review";
  return `${n.toLocaleString("en-IN")} ${base}${n === 1 ? "" : "s"}`;
};
