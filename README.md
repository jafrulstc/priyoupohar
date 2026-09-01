# 🌸 Bloom & Bliss — Gift & Flower Shop

A high-conversion, animation-rich e-commerce storefront for gifts & flowers, built with:

| Layer         | Technology                                                        |
| ------------- | ----------------------------------------------------------------- |
| Framework     | **Next.js 16** (App Router) + **React 19** + **TypeScript 5**      |
| Styling       | **Tailwind CSS v4** + **shadcn/ui** (New York) + custom brand theme |
| Animation     | **Framer Motion**, **canvas-confetti**, **lottie-react**           |
| Icons         | **lucide-react**                                                   |
| State         | **Zustand** (persisted cart / wishlist) + **TanStack Query**       |
| Database      | **Prisma ORM** + **SQLite** (zero-config, file-based)              |

> 🎁 Features: gift finder wizard, combo builder, cart drawer with free-shipping progress, wishlist, delivery-slot picker, pincode serviceability check, greeting-card designer, coupons, spin-to-win, dark mode, and more.

---

## 📖 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation Steps](#2-installation-steps)
3. [Environment Variables](#3-environment-variables)
4. [Running the Development Server](#4-running-the-development-server)
5. [Troubleshooting Common Issues](#5-troubleshooting-common-issues)
6. [Appendix: Scripts & Project Structure](#appendix-scripts--project-structure)

---

## 1. Prerequisites

### 1.1 Node.js (required)

This project uses **Next.js 16**, which requires **Node.js ≥ 20.9.0**.
Recommended: **Node 20 LTS** or **Node 22 LTS**. *(Node 18 is NOT supported.)*

Download from [nodejs.org](https://nodejs.org/) (the LTS installer also bundles `npm`).

Verify your installation:

```bash
node -v
# v20.19.0  ← anything ≥ v20.9.0 is fine

npm -v
```

### 1.2 Package Manager (pick ONE)

The project ships with a `bun.lock` file (it was developed with Bun), but **any manager below works** — npm is the simplest since it needs no extra install. Just be consistent: don't mix lockfiles.

| Manager | Version  | Install it with                          | Check version      |
| ------- | -------- | ---------------------------------------- | ------------------ |
| **npm** | ≥ 10     | ✅ Already bundled with Node.js           | `npm -v`           |
| **pnpm**| ≥ 9      | `npm install -g pnpm` or `corepack enable`| `pnpm -v`          |
| **yarn**| ≥ 1.22   | `npm install -g yarn` or `corepack enable`| `yarn -v`          |
| **bun** | ≥ 1.1    | [bun.sh](https://bun.sh/) (Win/mac/Linux) | `bun -v`           |

### 1.3 Everything else

- **Database**: Nothing to install. The app uses **SQLite** through Prisma — the database is just a single file (`db/custom.db`) created automatically in step 2.
- **API keys**: None required. All features (products, cart, checkout simulation) run fully offline.
- **Git** (optional): only needed if you clone instead of extracting a ZIP.

---

## 2. Installation Steps

### Step 1 — Get the code

**Option A — ZIP extraction:** extract the project archive to a folder **without spaces in its path** (e.g. `C:\dev\bloom-bliss` or `~/dev/bloom-bliss`), then open a terminal inside it.

**Option B — Git clone:**

```bash
git clone <your-repo-url> bloom-bliss
cd bloom-bliss
```

### Step 2 — Install all dependencies

Pick **one** command (all animation/UI libraries — Framer Motion, Lucide React, canvas-confetti, lottie-react, Zustand, Radix/shadcn — are already declared in `package.json`, so nothing needs manual installing):

```bash
# npm (recommended for first-timers)
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

⏱️ This downloads ~500 MB of packages and takes 1–5 minutes depending on your connection.

### Step 3 — Create your environment file

The `.env` file is **not** included in the repository (it's git-ignored), so you must create it. Full details in [Section 3](#3-environment-variables) — the short version:

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local 2>/dev/null || touch .env.local
```

```powershell
# Windows PowerShell
New-Item -ItemType File -Force .env.local
```

Then paste this single required line into `.env.local`:

```env
DATABASE_URL=file:../db/custom.db
```

### Step 4 — Create the database & seed it with products

```bash
# 4a. Generate the Prisma Client (TypeScript types + query engine)
npx prisma generate

# 4b. Create the SQLite database file with the schema
npm run db:push        # → runs: prisma db push

# 4c. Seed the store with the 16 demo products (flowers, cakes, plants…)
npx tsx prisma/seed.ts
```

> 💡 `npx tsx` auto-downloads the TypeScript runner on first use — that's expected.
> **Bun users** can skip `tsx`: `bun prisma/seed.ts`

✅ **Checkpoint:** you should now have a file at `db/custom.db` (~50 KB) containing 16 products. If `db/` doesn't exist, create it first: `mkdir db` (the `db:push` command in 4b will place the file there).

### Step 5 — You're done installing 🎉

Jump to [Section 4](#4-running-the-development-server) to start the app.

---

## 3. Environment Variables

### 3.1 Which file to create?

Create **`.env.local`** in the project **root** (same level as `package.json`).

Why `.env.local`? Next.js loads env files in this priority order:

```
.env.local  >  .env.development  >  .env
```

`.env.local` overrides everything and is git-ignored by default, so your local secrets never get committed. ✅

### 3.2 Required variables

```env
# ─── REQUIRED ─────────────────────────────────────────────────────────────
# SQLite database connection used by Prisma.
#
# ⚠️ IMPORTANT — relative paths are resolved from prisma/schema.prisma,
# NOT from the project root. That's why it's "file:../db/custom.db"
# (one level UP from /prisma, then into /db).
#
# ⚠️ Always use forward slashes "/" — even on Windows.

DATABASE_URL=file:../db/custom.db
```

**Windows users — do NOT write this:**

```env
# ❌ WRONG (backslashes / drive letters break Prisma's file URL)
DATABASE_URL=file:C:\dev\bloom-bliss\db\custom.db

# ✅ RIGHT (relative + forward slashes)
DATABASE_URL=file:../db/custom.db
```

<details>
<summary>Prefer an absolute path instead? (works too)</summary>

```env
# Windows
DATABASE_URL=file:./db/custom.db   # relative is still the safest option

# macOS / Linux
DATABASE_URL=file:/Users/yourname/dev/bloom-bliss/db/custom.db
```
</details>

### 3.3 Optional variables (dummy examples — safe to skip)

The app currently reads **only `DATABASE_URL`**. Everything else works out of the box with zero third-party keys. If you later integrate services, here are conventional dummy placeholders:

```env
# ─── OPTIONAL (not used by the current codebase) ─────────────────────────
# Public URL, used by some libraries for canonical URLs / OG images
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Branding override (informational only)
NEXT_PUBLIC_SITE_NAME="Bloom & Bliss"

# Example of what a future integration would look like:
# STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
# NEXTAUTH_SECRET=any-random-string-here
```

> 🔒 Any variable prefixed with `NEXT_PUBLIC_` is exposed to the browser — never put real secrets there.

---

## 4. Running the Development Server

### 4.1 Start it

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

### ⚠️ 4.2 Windows-only note

The `dev` script pipes logs through `tee` (a Unix tool), so on **Windows cmd/PowerShell** you may see `'tee' is not recognized`. Use the cross-platform command instead:

```powershell
npx next dev -p 3000
```

*(Works identically on macOS/Linux too — it's the same underlying command.)*

### 4.3 Open the app

Open your browser at:

```
http://localhost:3000
```

You should see the **Bloom & Bliss** storefront with product grids loaded from the database. Hot-reload is active — edit any file in `src/` and the page updates instantly.

### 4.4 Quick smoke test ✅

1. Hero + product rails render with images (not empty grids).
2. Click **Add to Cart** → confetti burst + cart badge increments.
3. Click the cart icon → spring-animated drawer with free-shipping progress bar.
4. Toggle **dark mode** from the header.

### 4.5 Production build (optional)

For a production-optimized local preview:

```bash
# Build (any OS)
npx next build

# Start the production server
npx next start -p 3000
```

> ℹ️ This project is configured with `output: "standalone"` in `next.config.ts`. If `next start` complains, run the standalone server directly:
>
> ```bash
> # macOS / Linux
> NODE_ENV=production node .next/standalone/server.js
> ```
>
> ```powershell
> # Windows PowerShell
> $env:NODE_ENV="production"; node .next/standalone/server.js
> ```

---

## 5. Troubleshooting Common Issues

### 5.1 ❌ "Port 3000 is already in use"

Something else (often a zombie `node` process) is holding port 3000. **Either kill it or use another port.**

**Kill the process:**

```powershell
# Windows (cmd or PowerShell)
netstat -ano | findstr :3000
taskkill /PID <PID_FROM_ABOVE> /F
```

```bash
# macOS / Linux
lsof -ti:3000 | xargs kill -9
```

**Or just run on a different port:**

```bash
npx next dev -p 3001     # then open http://localhost:3001
```

### 5.2 ❌ "Module not found: …" / broken dependency errors

Usually a corrupted or half-finished install. Do a **clean reinstall**:

```bash
# npm — delete node_modules + lockfile artifacts and reinstall
rm -rf node_modules .next
npm cache clean --force
npm install
```

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, .next
npm cache clean --force
npm install
```

```bash
# pnpm / yarn / bun equivalents
pnpm install --force        # or: rm -rf node_modules && pnpm install
yarn install --check-files
bun install --force
```

**Also check:** your Node version meets the minimum (`node -v` → ≥ 20.9). Wrong Node versions are the #1 cause of native-module install failures (e.g. `sharp`).

### 5.3 ❌ UI changes don't appear / stale page

The `.next` build cache can go stale. **Clear it and restart:**

```bash
# macOS / Linux / Git Bash
rm -rf .next
npm run dev
```

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force .next
npm run dev
```

```cmd
:: Windows cmd
rmdir /s /q .next
npm run dev
```

> ⚠️ If the cart/wishlist state looks "stuck", it's not the cache — that's the persisted Zustand store in `localStorage`. Open DevTools → Application → Local Storage → `http://localhost:3000` → delete the keys, then refresh.

### 5.4 ❌ Prisma / database errors

| Error message | Cause | Fix |
| --- | --- | --- |
| `Environment variable not found: DATABASE_URL` | `.env.local` missing or in the wrong folder | Create it in the **project root** (next to `package.json`) — see §3 |
| `Error code 14: Unable to open the database file` | The `db/` folder doesn't exist, or the path in `DATABASE_URL` is wrong | `mkdir db`, then re-run `npm run db:push`. Keep forward slashes |
| `The column X does not exist` / schema drift | Schema changed without re-pushing | `npm run db:push` |
| `@prisma/client did not initialize yet` | Client not generated | `npx prisma generate` |
| Product grid is **empty** | DB exists but never seeded | `npx tsx prisma/seed.ts` |

**Nuclear option** (wipes DB and re-creates everything):

```bash
rm db/custom.db
npm run db:push
npx tsx prisma/seed.ts
```

### 5.5 ❌ `'tee' is not recognized` / `'cp' is not recognized` (Windows)

The bundled npm scripts use Unix tools (`tee`, `cp -r`). On Windows use the plain equivalents:

| Instead of…            | Use (any OS)                    |
| ---------------------- | ------------------------------- |
| `npm run dev`          | `npx next dev -p 3000`          |
| `npm run build`        | `npx next build`                |
| `npm run start`        | `npx next start -p 3000`        |
| `npm run lint`         | `npx next lint` or `npx eslint .` |

> 💡 Running Windows? **Git Bash** or **WSL** executes the original npm scripts without modification.

### 5.6 ❌ Hydration warning in console (development only)

You may see a one-time `Hydration mismatch` or zustand-persist notice on first load. This comes from the persisted cart store rehydrating after server render. It is **harmless** in dev mode and does not appear in production builds.

### 5.7 Still stuck?

- Check the terminal output where `npm run dev` is running — Next.js prints the real error there.
- Server logs are also written to `dev.log` in the project root (macOS/Linux).
- Delete `.next` + `node_modules` and redo [Section 2](#2-installation-steps) from Step 2 — that resolves ~95% of issues.

---

## Appendix: Scripts & Project Structure

### Available npm scripts

| Script              | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start dev server on port 3000 (logs → `dev.log`)    |
| `npm run build`     | Production build (standalone output)                |
| `npm run start`     | Run the standalone production server (via Bun)      |
| `npm run lint`      | ESLint check                                        |
| `npm run db:push`   | Push `prisma/schema.prisma` to the SQLite database  |
| `npm run db:generate` | Generate Prisma Client                            |
| `npm run db:migrate` | Create/apply a dev migration                       |
| `npm run db:reset`  | Drop & re-create the database                       |

### Project structure (key folders)

```
bloom-bliss/
├── prisma/
│   ├── schema.prisma        # Product model (SQLite)
│   └── seed.ts              # 16 demo products seeder
├── db/
│   └── custom.db            # SQLite database (created by db:push)
├── public/
│   └── images/              # Product & occasion imagery
├── src/
│   ├── app/                 # App Router pages + /api routes
│   │   ├── api/products/    # GET /api/products?category=&q=&limit=
│   │   └── api/checkout/    # POST /api/checkout (validated with zod)
│   ├── components/
│   │   ├── shop/            # All storefront sections (hero, cart, gift finder…)
│   │   └── ui/              # shadcn/ui primitives
│   ├── hooks/               # use-mounted, use-mobile, use-toast…
│   └── lib/                 # store.ts (Zustand), db.ts (Prisma), utils…
├── .env.local               # ← YOU create this (Section 3)
└── package.json
```

### API endpoints

| Endpoint              | Method | Purpose                          |
| --------------------- | ------ | -------------------------------- |
| `/api/products`       | GET    | List/filter products             |
| `/api/checkout`       | POST   | Validate cart & return order ETA |
| `/api/pincode`        | GET    | Delivery serviceability check    |
| `/api/slots`          | GET    | Available delivery slots         |

---

🛠️ **Stack versions:** Next.js ^16.1.1 · React ^19 · TypeScript ^5 · Tailwind CSS ^4 · Prisma ^6.11 · Framer Motion ^12 · Zustand ^5
