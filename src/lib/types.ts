export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  mrp: number;
  image: string;
  rating: number;
  reviews: number;
  tag?: string | null;
  sameDay: boolean;
  description: string;
  pairsWith?: string | null;
};

export const CATEGORIES = [
  { id: "flowers", label: "Flowers", emoji: "🌸" },
  { id: "cakes", label: "Cakes", emoji: "🍰" },
  { id: "personalised", label: "Personalised", emoji: "🎁" },
  { id: "plants", label: "Plants", emoji: "🪴" },
  { id: "combos", label: "Combos", emoji: "🎀" },
] as const;
