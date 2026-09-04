"""Static seed data — ported 1:1 from prisma/seed.ts so the existing
Next.js storefront assets (/images/products/*.jpg) keep working."""

CATEGORIES: list[dict] = [
    {"name": "Flowers", "slug": "flowers", "description": "Fresh hand-tied bouquets & vase arrangements."},
    {"name": "Cakes", "slug": "cakes", "description": "Bakery-fresh celebration cakes, same-day delivered."},
    {"name": "Personalised", "slug": "personalised", "description": "Mugs, chocolates, teddies & custom keepsakes."},
    {"name": "Plants", "slug": "plants", "description": "Easy-love greens & lucky plants for every home."},
    {"name": "Combos", "slug": "combos", "description": "Curated gift hampers that pair perfectly."},
]

# name, slug, category_slug, price, mrp, image, rating, reviews, badge (None = no badge)
P = [
    ("Eternal Red Roses Bouquet", "eternal-red-roses", "flowers", 549, 899, "/images/products/roses.jpg", 4.9, 2314, "Bestseller"),
    ("Sunshine Gerbera Bunch", "sunshine-gerbera", "flowers", 449, 699, "/images/products/gerbera.jpg", 4.7, 1205, None),
    ("Blushing Pink Lilies", "pink-lilies", "flowers", 649, 999, "/images/products/lily.jpg", 4.8, 864, "New"),
    ("Royal Orchid Vase Arrangement", "royal-orchid", "flowers", 899, 1299, "/images/products/orchid.jpg", 4.8, 512, "Premium"),
    ("Choco Truffle Dream Cake", "choco-truffle-cake", "cakes", 599, 899, "/images/products/choccake.jpg", 4.9, 3510, "Bestseller"),
    ("Black Forest Classic", "black-forest-cake", "cakes", 549, 799, "/images/products/forestcake.jpg", 4.7, 2210, None),
    ("Red Velvet Bliss Cake", "red-velvet-cake", "cakes", 699, 1049, "/images/products/velvetcake.jpg", 4.8, 1487, "New"),
    ("Photo Memory Mug", "photo-mug", "personalised", 399, 599, "/images/products/mug.jpg", 4.6, 986, None),
    ("Heartfelt Chocolates Box", "chocolate-box", "personalised", 499, 749, "/images/products/choco.jpg", 4.7, 1342, "Bestseller"),
    ("Cuddle Buddy Teddy — 2ft", "cuddle-teddy", "personalised", 699, 1099, "/images/products/teddy.jpg", 4.8, 1876, "Bestseller"),
    ("Lucky Jade Plant Duo", "jade-plant-duo", "plants", 449, 699, "/images/products/plants.jpg", 4.6, 421, "New"),
    ("Serene Succulent Garden", "succulent-garden", "plants", 549, 849, "/images/products/succulent.jpg", 4.7, 368, None),
    ("Rose & Truffle Combo", "rose-truffle-combo", "combos", 1099, 1699, "/images/products/combo1.jpg", 4.9, 1642, "Bestseller"),
    ("Grand Celebration Hamper", "celebration-hamper", "combos", 1899, 2799, "/images/products/combo2.jpg", 4.9, 733, "Premium"),
    ("Teddy & Lilies Duo", "teddy-lilies-duo", "combos", 999, 1499, "/images/products/combo3.jpg", 4.7, 615, None),
    ("Midnight Surprise Box", "midnight-surprise-box", "combos", 1299, 1999, "/images/products/combo4.jpg", 4.8, 892, "New"),
]

DESCRIPTIONS: dict[str, str] = {
    "eternal-red-roses": "20 hand-tied velvety red roses wrapped in premium craft paper with a satin ribbon.",
    "sunshine-gerbera": "10 radiant mixed gerberas that turn any ordinary day into a festival of colours.",
    "pink-lilies": "Fragrant Asiatic pink lilies arranged with lush greens in a chic wrap.",
    "royal-orchid": "Elegant white phalaenopsis orchids in a glass vase — luxury that lasts.",
    "choco-truffle-cake": "Half-kg Belgian chocolate truffle crowned with glossy ganache & cherries.",
    "black-forest-cake": "Timeless layers of chocolate sponge, whipped cream, cherries & shavings.",
    "red-velvet-cake": "Velvety crimson sponge with silky cream-cheese frosting — pure romance.",
    "photo-mug": "Relive favourite moments every morning — print any photo on a glossy ceramic mug.",
    "chocolate-box": "12 hand-rolled truffles & pralines nestled in a keepsake gold-embossed box.",
    "cuddle-teddy": "Cloud-soft huggable teddy in a blushing scarf — hugs included, free forever.",
    "jade-plant-duo": "Twin jade plants in pastel ceramic pots — prosperity, delivered to the doorstep.",
    "succulent-garden": "A tabletop garden of five easy-love succulents for the plant parent in your life.",
    "rose-truffle-combo": "10 red roses with a half-kg choco truffle cake — the classic 'you're special' move.",
    "celebration-hamper": "Roses, red velvet cake, chocolates & a 2ft teddy in one show-stopping hamper.",
    "teddy-lilies-duo": "Blushing lilies with a plush teddy — soft, sweet & absolutely adorable.",
    "midnight-surprise-box": "Cake, roses, ferrero & fairy lights — delivered right when the clock strikes 12.",
}

# Deterministic stock levels (kept within 15-60).
STOCK: dict[str, int] = {
    "eternal-red-roses": 48, "sunshine-gerbera": 35, "pink-lilies": 30,
    "royal-orchid": 22, "choco-truffle-cake": 40, "black-forest-cake": 38,
    "red-velvet-cake": 32, "photo-mug": 55, "chocolate-box": 50,
    "cuddle-teddy": 45, "jade-plant-duo": 28, "succulent-garden": 26,
    "rose-truffle-combo": 33, "celebration-hamper": 18, "teddy-lilies-duo": 24,
    "midnight-surprise-box": 21,
}

# Ported from prisma/seed.ts (storefront parity).
SAME_DAY: dict[str, bool] = {
    slug: slug not in {"royal-orchid", "jade-plant-duo", "succulent-garden"}
    for slug in STOCK
}

PAIRS_WITH: dict[str, str] = {
    "eternal-red-roses": "chocolate-box,cuddle-teddy",
    "sunshine-gerbera": "photo-mug,chocolate-box",
    "pink-lilies": "cuddle-teddy,chocolate-box",
    "royal-orchid": "chocolate-box,jade-plant-duo",
    "choco-truffle-cake": "eternal-red-roses,cuddle-teddy",
    "black-forest-cake": "sunshine-gerbera,photo-mug",
    "red-velvet-cake": "eternal-red-roses,chocolate-box",
    "photo-mug": "succulent-garden,chocolate-box",
    "chocolate-box": "eternal-red-roses,red-velvet-cake",
    "cuddle-teddy": "eternal-red-roses,black-forest-cake",
    "jade-plant-duo": "photo-mug,chocolate-box",
    "succulent-garden": "photo-mug,chocolate-box",
    "rose-truffle-combo": "cuddle-teddy,photo-mug",
    "celebration-hamper": "photo-mug",
    "teddy-lilies-duo": "chocolate-box,photo-mug",
    "midnight-surprise-box": "cuddle-teddy,photo-mug",
}

DEMO_CUSTOMERS: list[dict] = [
    {"name": "Ravi Kumar", "email": "ravi@demo.test", "password": "Demo@1234"},
    {"name": "Priya Sharma", "email": "priya@demo.test", "password": "Demo@1234"},
]

# (customer_index, status, [(product_slug, quantity)])
SAMPLE_ORDERS: list[tuple[int, str, list[tuple[str, int]]]] = [
    (0, "pending", [("eternal-red-roses", 1)]),                      # 549 + 79
    (1, "shipped", [("choco-truffle-cake", 1), ("photo-mug", 1)]),   # 998 + 79
    (0, "delivered", [("celebration-hamper", 1)]),                   # 1899 + 0
]

CUSTOMER_PROFILES: list[dict] = [
    {
        "phone": "01712345678", "email_to": "ravi@demo.test",
        "address": "12 Rose Villa, Gulshan 1",
        "city": "Dhaka", "pincode": "1212",
    },
    {
        "phone": "01812345678", "email_to": "priya@demo.test",
        "address": "48 Lotus Enclave, Nasirabad",
        "city": "Chittagong", "pincode": "4000",
    },
]

SEED_ORDER_NOTE = "seed:demo-order"
