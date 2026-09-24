# Architecture

Ceylon Weddings is a **pnpm + Turborepo monorepo** with one public website, a NestJS API, and a set of shared packages.

The public product is **one website** (The Knot / planmywedding.lk pattern): marketplace, couple planning, vendor pro, admin, and guest pages on the same origin. Role changes the chrome after login.

---

## Locked versions (Aug 2026)

| Layer | Choice |
|-------|--------|
| Node | 22 + (local 24) |
| Monorepo | pnpm 10 + Turborepo 2 |
| API | NestJS 11 |
| Web | Next.js 16, React 19, App Router |
| Contracts | Zod 4 + nestjs-zod 5 → OpenAPI/Swagger |
| DB | PostgreSQL 16 + Prisma 7 (`PrismaPg` adapter) |
| Cache / queues / realtime | Redis 7, BullMQ 5, Socket.IO 4 + Redis adapter |
| UI | Tailwind 4, Radix, shadcn-style kit, Lucide |
| Client state | Zustand 5 |
| i18n | next-intl, `en` / `si` / `ta` |
| Themes | next-themes: pearl, temple, night |
| Auth | httpOnly cookies, not localStorage |

---

## Workspace layout

```
CeylonWeddings/
├── apps/
│   ├── api/          NestJS API                  → :4000  /docs (Swagger)
│   ├── web/          Public Next.js site          → :3000
│   └── mobile/       Expo placeholder             → deferred
│
├── packages/
│   ├── contracts/    Zod schemas (API + web + mobile)
│   ├── database/     Prisma schema + client + NestJS PrismaModule
│   ├── ui/           Radix/shadcn primitives + tokens + domain components
│   ├── web/          API client, Zustand stores, cookie helpers, providers
│   ├── i18n/         Message catalogs (en / si / ta)
│   ├── env/          Zod env validation
│   └── typescript-config/
│
├── docs/             All documentation (you are here)
├── specs/            Behaviour contracts before code
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

> **`packages/web` ≠ `apps/web`.**
> `packages/web` is the shared client library (API client, stores, hooks, providers).
> `apps/web` is the Next.js site that consumes it.

---

## Apps

### `apps/api` — NestJS API (:4000)

- Contract-first. DTOs wrap `packages/contracts` Zod schemas.
- Swagger auto-generated at `/docs` via `cleanupOpenApiDoc`.
- Authentication via `JwtCookieGuard` + `@CurrentUser()` decorator.
- Modules under `src/modules/`:

| Module | Responsibility |
|--------|---------------|
| `auth` | Register, login, logout, `/auth/me` |
| `weddings` | Wedding record, tasks, budget, events, guests, music, moodboards, seating |
| `admin` | Vendor moderation, users, content, featured placements, audit, ads |
| `search` | Vendor catalog search + filters |
| `messaging` | Support conversations |
| `realtime` | Socket.IO gateway |
| `jobs` | BullMQ email processor (welcome, inquiry, RSVP reminders) |
| `ai` | AI stub / future integrations |
| `subscription` | Vendor subscription lifecycle |
| `health` | Liveness/readiness probes |

### `apps/web` — Next.js 16 (:3000)

- App Router under `src/app/[locale]/…`.
- Locale segment: `en` | `si` | `ta` — driven by `cw_locale` cookie.
- Chrome is role-driven: public header → couple top nav → vendor/admin left rail.
- Fonts: Geist Sans (body), Cormorant Garamond (display), Source Serif 4 (serif mood), Great Vibes (script).

---

## Packages

### `packages/contracts`

Single source of truth for API shapes.

```
src/
├── auth.ts          Register, Login, User types
├── common.ts        Shared primitives (pagination, money)
├── query.ts         Catalog query params
├── search.ts        Full-text search types
├── health.ts
├── admin/           Admin-specific contracts
├── content/         Article contracts
├── messaging/       Conversation contracts
├── promotion/       Ads/promotion contracts
├── vendor/          Vendor storefront + packages contracts
└── wedding/         Wedding, events, tasks, budget, guests, seating, music, moodboard
```

### `packages/database`

- `prisma/schema.prisma` — 1 232-line full domain model.
- `src/` — generated Prisma client + `PrismaModule` for NestJS.
- Migrations under `prisma/migrations/`.

### `packages/ui`

Component library used by `apps/web`. Never import from `apps/web` back into here.

```
src/
├── components/      Primitive UI (Button, Input, Card, Dialog, Tabs, …)
├── domain/          Domain composites (AppShell, VendorCard, BudgetMeter, …)
├── contracts/       Internal prop-type helpers
├── lib/             cn(), token helpers
├── motion/          Framer-Motion stagger helpers
└── styles/          Global tokens and Tailwind config
```

### `packages/web`

Shared client library. Used by `apps/web`; will also be used by `apps/mobile`.

```
src/
├── api/             Typed fetch client wrapping every endpoint
├── stores/          Zustand stores (preference, auth session)
├── hooks/           Shared React hooks
├── lib/             formatMoney, date helpers, cookie utils
└── providers/       AppProviders (theme, auth, preference)
```

---

## Contract flow

1. Write or change a Zod schema in `packages/contracts`.
2. Wrap it with `createZodDto` in the relevant NestJS DTO.
3. Swagger updates automatically via `cleanupOpenApiDoc` in `main.ts`.
4. Frontends import the same schema and use `z.infer<>` for types.
5. Behaviour is described in a `/specs/*.md` file **before** code grows.

```
packages/contracts  ──→  apps/api (DTOs, Guards)
        ↓
packages/contracts  ──→  packages/web (API client types)
        ↓
packages/web        ──→  apps/web (typed fetch, stores)
```

---

## Authentication

Cookies, not localStorage. All auth flows use `credentials: "include"`.

| Cookie | HttpOnly | TTL | Purpose |
|--------|----------|-----|---------|
| `cw_access` | ✅ | 15 min | JWT for API calls |
| `cw_refresh` | ✅ | 30 days | Rotating refresh session |
| `cw_locale` | ❌ | persistent | `en` / `si` / `ta` |
| `cw_currency` | ❌ | persistent | `LKR` / `USD` / `AUD` / `GBP` / `EUR` |
| `cw_theme` | ❌ | persistent | `pearl` / `temple` / `night` |

Auth cookies are first-party to `localhost` in dev and `.ceylonweddings.com` in prod.

---

## Realtime & jobs

- **Socket.IO** path `/realtime`, Redis adapter for horizontal scaling.
- **BullMQ** queue `email`:
  - `welcome` — on registration
  - `inquiry` — on new couple → vendor inquiry
  - `rsvp-reminder` — scheduled before events
- All processors **log in v0**; actual email delivery is a later integration.

---

## Themes

Three visual themes, toggled via `next-themes` and `cw_theme` cookie.

| Theme | Character |
|-------|-----------|
| `pearl` | Ivory / warm white, cool teal secondary. Default. |
| `temple` | Gold / saffron primary, rich warm tones. |
| `night` | Dark canvas, gold accents. |

CSS custom properties (`--primary`, `--secondary`, `--background`, `--chart-*`, etc.) drive all components. No hard-coded hex values in components.

---

## i18n

- Three locales: `en` (English), `si` (Sinhala), `ta` (Tamil).
- Message catalogs in `packages/i18n/`.
- `next-intl` drives locale routing via the `[locale]` segment.
- All API money values are stored in **integer LKR**. Display conversion happens in the client via `formatMoney(lkr, currency)`.
- Data model fields that need translations use separate locale variants (e.g. `vendor.name` in EN; SI/TA copy is deferred for v1.5).

---

## Deferred (not in MVP)

- Couple mobile app (`apps/mobile` Expo placeholder)
- WhatsApp Business API (WABA) — inquiry deep-links use `wa.me` instead
- PayHere / Stripe checkout (schema ready; UI deferred)
- Seating drag-and-drop canvas (API + basic seating exists; canvas UX is v1.5)
- Reviews (model exists; moderation UI exists in admin; public display is v1.5)
- Paid featured marketplace (schedule management in admin; checkout deferred)
- TOTP admin 2FA (columns exist; UI deferred)
- In-app Messenger (conversations model exists; replaced by WhatsApp CTAs in v1)
