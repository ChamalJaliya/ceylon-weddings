# Ceylon Weddings

Sri Lanka–first wedding planning platform — free couple tools + vendor marketplace as **one public website**.

## Quick start

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Seed logins (password `Password123!`)

| App | URL | Login |
|-----|-----|-------|
| Public site | http://localhost:3000 | — |
| Planning hub | http://localhost:3000/planning | couple@ceylonweddings.com |
| Vendor Pro | http://localhost:3000/pro | vendor@ceylonweddings.com |
| Admin | http://localhost:3000/admin | admin@ceylonweddings.com |
| Guest site demo | http://localhost:3000/w/nimali-and-kasun | — |
| API / Swagger | http://localhost:4000/docs | — |

## Stack

Next.js 16 · NestJS 11 · PostgreSQL 16 · Prisma 7 · Redis 7 · BullMQ 5 · Socket.IO 4 · Zod 4 · Zustand 5 · Tailwind 4 · Radix · Lucide · next-intl · pnpm + Turborepo

## Documentation

All docs are in [`/docs`](docs/):

| Doc | What it covers |
|-----|---------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Monorepo layout, stack, contract flow, auth, realtime, i18n |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Full Prisma domain model (enums, entities, relations) |
| [docs/INFORMATION_ARCHITECTURE.md](docs/INFORMATION_ARCHITECTURE.md) | Every route and chrome decision |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | All REST endpoints by domain |
| [docs/MODULES.md](docs/MODULES.md) | Product modules: MVP / v1.5 / v2 with status |
| [docs/UI_COMPONENTS.md](docs/UI_COMPONENTS.md) | `packages/ui` component inventory |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Dev setup, conventions, how to add a feature |
