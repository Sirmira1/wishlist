# ✨ Life Wishlist

> The ultimate wishlist, inventory, collection & acquisition-management platform. Track **anything** you want to own, buy, upgrade, collect, build or experience — with a premium, glassmorphic UI, rich analytics, budgets, rooms, collections, PC-build & vehicle tracking, and a public-share mode.

Built to feel like Notion × Linear × Steam Library. Production-ready and deployable to **Vercel** in minutes.

---

## ✅ Feature highlights

| Area | What you get |
| --- | --- |
| **Universal items** | 40+ fields per item: pricing (MSRP/current/discount/tax/shipping), condition, brand/model, tags, gallery, SKU, serial, warranty, quantities, custom fields, related items |
| **Statuses & priorities** | 19 colour-coded statuses (Dream → Acquired → Archived) and 7 priority levels |
| **Views** | Gallery, Table, List, Kanban (by status) and Timeline — plus advanced filters, multi-facet search & sorting |
| **Organize** | Categories (nested), Collections (nested), Rooms with completion %, PC-Build tracker, Vehicle dashboard |
| **Analytics** | Donut, bar, area, line & treemap charts — cost by category, status/priority breakdowns, growth over time, price distribution, monthly spending |
| **Budget & goals** | Monthly/yearly/category/collection budgets, savings goals, **wishlist-completion date forecast** |
| **Price tracking** | Manual price history, lowest/highest, potential savings vs MSRP |
| **Roadmap & achievements** | Lifetime acquisition timeline + unlockable milestone badges |
| **Import / export** | CSV import with a **field-mapping wizard** (PCPartPicker-friendly), CSV/JSON export, full DB backup & restore |
| **Public mode** | Anyone can browse, filter, search & view charts; a dedicated shareable `/public` page |
| **Admin & security** | bcrypt password, JWT session cookies, first-run setup, rate limiting, secure headers, auto-logout, token regeneration, recovery codes |
| **Polish** | Light/dark/system themes, custom accent colours, Framer-Motion animations, command palette (⌘K), keyboard-friendly, fully responsive |

---

## 🧱 Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **TailwindCSS** + **ShadCN-style** UI (Radix primitives)
- **Prisma ORM** + **PostgreSQL** (Supabase-ready)
- **TanStack Query** (server state) + **Zustand** (client state)
- **Framer Motion** (animation) + **Recharts** (charts)
- **jose** (JWT) + **bcryptjs** (hashing) — lightweight custom auth tuned for the single-admin model
- Deployable to **Vercel**

> **A note on auth:** the spec listed NextAuth/Auth.js. For a *single-admin, public-read* site, a focused JWT-cookie + bcrypt implementation is simpler, faster and easier to reason about than a full NextAuth setup — so that's what's used (`src/lib/auth.ts`, `src/lib/jwt.ts`, `src/middleware.ts`). It still delivers everything requested: password auth, sessions, JWTs, rate limiting, CSRF-safe same-site cookies, auto-logout, token regeneration and recovery codes.

---

## 🚀 Quick start (local)

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/wishlist?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/wishlist?schema=public"
AUTH_SECRET="<run: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\">"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Need a database fast?** Run one with Docker:

```bash
docker run -d --name lw-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wishlist -p 5432:5432 postgres:16-alpine
# then in .env:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wishlist?schema=public"
# DIRECT_URL="postgresql://postgres:postgres@localhost:5432/wishlist?schema=public"
```

### 3. Create the schema

```bash
npm run db:push        # pushes the Prisma schema to your database
```

### 4. (Optional) Seed sample data

```bash
npm run db:seed        # default categories + demo items/collection/room
```

Set `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` in `.env` first if you want the seed to create your admin login; otherwise you'll create it on first run.

### 5. Run

```bash
npm run dev
```

Open **http://localhost:3000**. On first launch you'll be sent to **`/setup`** to create your admin username & password (hashed with bcrypt). After that, everyone can browse; only you can edit.

---

## ☁️ Deploy to Vercel

1. **Create a Supabase project** → *Project Settings → Database*. Grab two connection strings:
   - **Pooled** (pgBouncer, port `6543`) → use for `DATABASE_URL`
   - **Direct** (port `5432`) → use for `DIRECT_URL`

2. **Push the schema** to Supabase from your machine (one-time):

   ```bash
   # .env pointed at Supabase
   npm run db:push
   ```

3. **Import the repo into Vercel** and set Environment Variables:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Supabase **pooled** URL (append `&pgbouncer=true&connection_limit=1`) |
   | `DIRECT_URL` | Supabase **direct** URL |
   | `AUTH_SECRET` | a long random string |
   | `NEXT_PUBLIC_APP_URL` | your deployment URL, e.g. `https://wishlist.yourdomain.com` |

4. **Deploy.** The build runs `prisma generate && next build` automatically (see `package.json`). No extra config needed — `vercel.json` is optional.

5. Visit your site → complete `/setup` → you're live. Share the read-only view at `https://your-domain/public`.

> **Tip:** In-memory rate limiting is per-serverless-instance. For strict global limits, back `src/lib/rate-limit.ts` with Upstash Redis (the interface stays the same).

---

## 📁 Project structure

```
src/
├── app/
│   ├── (app)/                 # authenticated app shell (sidebar + topbar)
│   │   ├── page.tsx           # dashboard
│   │   ├── items/             # list, detail, new, edit
│   │   ├── collections/ rooms/ analytics/ budget/ activity/
│   │   ├── pc-builds/ vehicles/ roadmap/ achievements/ settings/
│   │   ├── import/ backup/
│   ├── api/                   # route handlers (items, auth, stats, import…)
│   ├── setup/ login/ public/  # standalone pages (no app shell)
│   └── layout.tsx globals.css
├── components/                # ui/ (ShadCN), charts, item views, layout…
├── hooks/                     # React Query hooks
├── lib/                       # prisma, auth, stats, utils, validations, constants
├── store/                     # Zustand UI state
├── types/                     # shared DTO types
└── middleware.ts              # admin-route protection (edge JWT check)
prisma/
├── schema.prisma              # full data model
└── seed.ts                    # default categories + demo data
```

## 🔐 Security model

- **Public** visitors can browse, filter, search and view analytics (toggleable in Settings).
- **Admin** actions (create/edit/delete, settings, import, backup) require a valid session.
- Passwords hashed with **bcrypt** (cost 12); sessions are signed **JWTs** in HTTP-only, same-site cookies.
- **Token versioning** — “Regenerate session tokens” invalidates every existing session instantly.
- **Auto-logout** after configurable inactivity; **recovery codes** for locked-out admins.
- Secure headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) via `next.config.mjs`.

## 🛠️ Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run the production build |
| `npm run db:push` | Push schema to the database |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:seed` | Seed categories + demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run typecheck` | `tsc --noEmit` |

---

Made with ❤️ as a premium, self-hostable wishlist platform.
