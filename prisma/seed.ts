import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  price: number;
  mrp: number;
  image: string;
  rating: number;
  reviews: number;
  tag?: string;
  sameDay: boolean;
  description: string;
};

const PRODUCTS: SeedProduct[] = [
  // ---------- FLOWERS ----------
  {
    name: "Eternal Red Roses Bouquet",
    slug: "eternal-red-roses",
    category: "flowers",
    price: 549,
    mrp: 899,
    image: "/images/products/roses.jpg",
    rating: 4.9,
    reviews: 2314,
    tag: "Bestseller",
    sameDay: true,
    description: "20 hand-tied velvety red roses wrapped in premium craft paper with a satin ribbon.",
  },
  {
    name: "Sunshine Gerbera Bunch",
    slug: "sunshine-gerbera",
    category: "flowers",
    price: 449,
    mrp: 699,
    image: "/images/products/gerbera.jpg",
    rating: 4.7,
    reviews: 1205,
    sameDay: true,
    description: "10 radiant mixed gerberas that turn any ordinary day into a festival of colours.",
  },
  {
    name: "Blushing Pink Lilies",
    slug: "pink-lilies",
    category: "flowers",
    price: 649,
    mrp: 999,
    image: "/images/products/lily.jpg",
    rating: 4.8,
    reviews: 864,
    tag: "New",
    sameDay: true,
    description: "Fragrant Asiatic pink lilies arranged with lush greens in a chic wrap.",
  },
  {
    name: "Royal Orchid Vase Arrangement",
    slug: "royal-orchid",
    category: "flowers",
    price: 899,
    mrp: 1299,
    image: "/images/products/orchid.jpg",
    rating: 4.8,
    reviews: 512,
    tag: "Premium",
    sameDay: false,
    description: "Elegant white phalaenopsis orchids in a glass vase — luxury that lasts.",
  },

  // ---------- CAKES ----------
  {
    name: "Choco Truffle Dream Cake",
    slug: "choco-truffle-cake",
    category: "cakes",
    price: 599,
    mrp: 899,
    image: "/images/products/choccake.jpg",
    rating: 4.9,
    reviews: 3510,
    tag: "Bestseller",
    sameDay: true,
    description: "Half-kg Belgian chocolate truffle crowned with glossy ganache & cherries.",
  },
  {
    name: "Black Forest Classic",
    slug: "black-forest-cake",
    category: "cakes",
    price: 549,
    mrp: 799,
    image: "/images/products/forestcake.jpg",
    rating: 4.7,
    reviews: 2210,
    sameDay: true,
    description: "Timeless layers of chocolate sponge, whipped cream, cherries & shavings.",
  },
  {
    name: "Red Velvet Bliss Cake",
    slug: "red-velvet-cake",
    category: "cakes",
    price: 699,
    mrp: 1049,
    image: "/images/products/velvetcake.jpg",
    rating: 4.8,
    reviews: 1487,
    tag: "New",
    sameDay: true,
    description: "Velvety crimson sponge with silky cream-cheese frosting — pure romance.",
  },

  // ---------- PERSONALISED ----------
  {
    name: "Photo Memory Mug",
    slug: "photo-mug",
    category: "personalised",
    price: 399,
    mrp: 599,
    image: "/images/products/mug.jpg",
    rating: 4.6,
    reviews: 986,
    sameDay: true,
    description: "Relive favourite moments every morning — print any photo on a glossy ceramic mug.",
  },
  {
    name: "Heartfelt Chocolates Box",
    slug: "chocolate-box",
    category: "personalised",
    price: 499,
    mrp: 749,
    image: "/images/products/choco.jpg",
    rating: 4.7,
    reviews: 1342,
    tag: "Bestseller",
    sameDay: true,
    description: "12 hand-rolled truffles & pralines nestled in a keepsake gold-embossed box.",
  },
  {
    name: "Cuddle Buddy Teddy — 2ft",
    slug: "cuddle-teddy",
    category: "personalised",
    price: 699,
    mrp: 1099,
    image: "/images/products/teddy.jpg",
    rating: 4.8,
    reviews: 1876,
    tag: "Bestseller",
    sameDay: true,
    description: "Cloud-soft huggable teddy in a blushing scarf — hugs included, free forever.",
  },

  // ---------- PLANTS ----------
  {
    name: "Lucky Jade Plant Duo",
    slug: "jade-plant-duo",
    category: "plants",
    price: 449,
    mrp: 699,
    image: "/images/products/plants.jpg",
    rating: 4.6,
    reviews: 421,
    tag: "New",
    sameDay: false,
    description: "Twin jade plants in pastel ceramic pots — prosperity, delivered to the doorstep.",
  },
  {
    name: "Serene Succulent Garden",
    slug: "succulent-garden",
    category: "plants",
    price: 549,
    mrp: 849,
    image: "/images/products/succulent.jpg",
    rating: 4.7,
    reviews: 368,
    sameDay: false,
    description: "A tabletop garden of five easy-love succulents for the plant parent in your life.",
  },

  // ---------- COMBOS ----------
  {
    name: "Rose & Truffle Combo",
    slug: "rose-truffle-combo",
    category: "combos",
    price: 1099,
    mrp: 1699,
    image: "/images/products/combo1.jpg",
    rating: 4.9,
    reviews: 1642,
    tag: "Bestseller",
    sameDay: true,
    description: "10 red roses with a half-kg choco truffle cake — the classic 'you're special' move.",
  },
  {
    name: "Grand Celebration Hamper",
    slug: "celebration-hamper",
    category: "combos",
    price: 1899,
    mrp: 2799,
    image: "/images/products/combo2.jpg",
    rating: 4.9,
    reviews: 733,
    tag: "Premium",
    sameDay: true,
    description: "Roses, red velvet cake, chocolates & a 2ft teddy in one show-stopping hamper.",
  },
  {
    name: "Teddy & Lilies Duo",
    slug: "teddy-lilies-duo",
    category: "combos",
    price: 999,
    mrp: 1499,
    image: "/images/products/combo3.jpg",
    rating: 4.7,
    reviews: 615,
    sameDay: true,
    description: "Blushing lilies with a plush teddy — soft, sweet & absolutely adorable.",
  },
  {
    name: "Midnight Surprise Box",
    slug: "midnight-surprise-box",
    category: "combos",
    price: 1299,
    mrp: 1999,
    image: "/images/products/combo4.jpg",
    rating: 4.8,
    reviews: 892,
    tag: "New",
    sameDay: true,
    description: "Cake, roses, ferrero & fairy lights — delivered right when the clock strikes 12.",
  },
];

async function main() {
  console.log("Seeding products…");
  let i = 0;
  for (const p of PRODUCTS) {
    i += 1;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...p, sortOrder: i },
      create: { ...p, sortOrder: i },
    });
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
