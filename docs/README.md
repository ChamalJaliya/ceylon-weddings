# Ceylon Weddings — Documentation Hub

> Sri Lanka–first wedding planning platform: free couple tools + vendor marketplace on one public website.

---

## 📂 Doc index

| File | What it covers |
|------|---------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Monorepo layout, locked stack, contract flow, cookies, realtime, jobs |
| [DATA_MODEL.md](./DATA_MODEL.md) | Full domain model: enums → entities → relations |
| [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md) | Every route, surface, and chrome decision |
| [API_REFERENCE.md](./API_REFERENCE.md) | All REST endpoints grouped by domain |
| [MODULES.md](./MODULES.md) | Product modules: MVP vs v1.5 vs v2 with SR Lanka context |
| [UI_COMPONENTS.md](./UI_COMPONENTS.md) | `packages/ui` component inventory and design system |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Dev setup, conventions, contract flow, adding a feature |

Specs (behaviour contracts before code) live in [`/specs`](../specs/).

---

## Quick start

```bash
cp .env.example .env
docker compose up -d          # Postgres + Redis
pnpm install
pnpm db:generate              # Generate Prisma client
pnpm db:migrate               # Run migrations
pnpm db:seed                  # Seed test accounts + sample data
pnpm dev                      # All apps (Turbo watch)
```

| App | URL | Seed login |
|-----|-----|-----------|
| Public site | http://localhost:3000 | couple@ceylonweddings.com / Password123! |
| Planning hub | http://localhost:3000/planning | family@… or kasun@… |
| Vendor Pro | http://localhost:3000/pro | vendor@ceylonweddings.com |
| Admin | http://localhost:3000/admin | admin@ceylonweddings.com |
| Guest site demo | http://localhost:3000/w/nimali-and-kasun | no login |
| API / Swagger | http://localhost:4000/docs | — |

---

## Stack snapshot (Aug 2026)

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
| Themes | next-themes: **pearl**, **temple**, **night** |
| Auth | httpOnly cookies, not localStorage |
