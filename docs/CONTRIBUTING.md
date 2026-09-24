# Contributing

How to work on Ceylon Weddings: setup, conventions, the contract flow, and a step-by-step guide for adding a new feature.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22+ | Use [nvm](https://github.com/nvm-sh/nvm): `nvm use` |
| pnpm | 10+ | `npm i -g pnpm` |
| Docker | any recent | For Postgres + Redis |

---

## First-time setup

```bash
# 1. Clone
git clone https://github.com/your-org/CeylonWeddings.git
cd CeylonWeddings

# 2. Copy environment
cp .env.example .env
# Edit .env and fill in DATABASE_URL, REDIS_URL, JWT_SECRET, etc.

# 3. Start infrastructure
docker compose up -d          # Postgres :5432, Redis :6379

# 4. Install dependencies
pnpm install

# 5. Set up database
pnpm db:generate              # Generate Prisma client from schema
pnpm db:migrate               # Run all migrations
pnpm db:seed                  # Seed test accounts + sample data

# 6. Run all apps
pnpm dev                      # Turborepo watch mode
```

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| Swagger | http://localhost:4000/docs |

---

## Useful scripts

Run from the **repo root** using Turborepo:

```bash
pnpm dev                # Dev server for all apps
pnpm build              # Production build (all apps)
pnpm lint               # ESLint across all packages
pnpm type-check         # TypeScript check across all packages
pnpm db:generate        # Regenerate Prisma client (after schema changes)
pnpm db:migrate         # Apply new migration
pnpm db:studio          # Open Prisma Studio (DB GUI)
pnpm db:seed            # Re-seed (drops existing seed data)
```

Run inside a specific app/package:

```bash
cd apps/api && pnpm dev       # API only
cd apps/web && pnpm dev       # Web only
```

---

## Environment variables

See `.env.example` for the full list. Key variables:

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://…` | Prisma connection string |
| `REDIS_URL` | `redis://localhost:6379` | BullMQ + Socket.IO adapter |
| `JWT_SECRET` | random 64-char string | Access token signing |
| `JWT_REFRESH_SECRET` | random 64-char string | Refresh token signing |
| `API_URL` | `http://localhost:4000` | Used by `apps/web` to call the API |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Browser-side API calls |
| `S3_BUCKET` / `S3_REGION` / `S3_KEY` / `S3_SECRET` | | Media uploads (presigned URLs) |
| `RESEND_API_KEY` | | Email (BullMQ jobs; can be empty in dev) |

---

## Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Couple | couple@ceylonweddings.com | Password123! |
| Family member | family@ceylonweddings.com | Password123! |
| Couple (alt) | kasun@ceylonweddings.com | Password123! |
| Vendor | vendor@ceylonweddings.com | Password123! |
| Admin | admin@ceylonweddings.com | Password123! |

---

## Architecture conventions

### Contract-first development

The Zod schema in `packages/contracts` is always the source of truth.

1. **Write the contract first** — add or edit a schema in `packages/contracts/src/`.
2. **Wrap it in a NestJS DTO** — `createZodDto(mySchema)` in the relevant module's `.dto.ts`.
3. **Swagger auto-updates** — `cleanupOpenApiDoc` in `apps/api/src/main.ts` picks it up.
4. **Use `z.infer<>` on the frontend** — import the schema from `@ceylonweddings/contracts`, never re-define types.

```ts
// packages/contracts/src/wedding/task.ts
export const createTaskSchema = z.object({
  title: z.string().min(1),
  dueAt: z.string().datetime().optional(),
  category: z.string().optional(),
});
export type CreateTask = z.infer<typeof createTaskSchema>;

// apps/api/src/modules/weddings/wedding.dto.ts
export class CreateTaskDto extends createZodDto(createTaskSchema) {}
```

### Money

- Store as **integer LKR** in Prisma. No floats.
- Display with `formatMoney(lkr, currency)` from `@ceylonweddings/web`.
- Never convert currency server-side; conversion is client-only.

### Auth

- Use `@UseGuards(JwtCookieGuard)` on every protected endpoint.
- Get the current user with `@CurrentUser() user: User`.
- The `User` type comes from `@ceylonweddings/contracts`.
- Role checks: compare `user.role` against `Role` enum values.
- Capability checks (admin): `user.capabilities.includes(AdminCapability.MANAGE_VENDORS)`.

### Error handling

- Throw NestJS built-in exceptions: `NotFoundException`, `ForbiddenException`, `ConflictException`, `BadRequestException`.
- Zod validation errors are handled automatically by `nestjs-zod`'s global pipe — you don't need try/catch for input validation.

---

## How to add a new feature

### 1. Write a spec (optional but encouraged)

Create `specs/003-my-feature.md` with:
- Status: `proposed`
- Goal
- API contract (endpoints + request/response shapes)
- Non-goals

### 2. Add the Zod contract

In `packages/contracts/src/`:

```ts
// e.g. packages/contracts/src/wedding/appointment.ts
export const createAppointmentSchema = z.object({ … });
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
```

Export it from `packages/contracts/src/index.ts`.

### 3. Add the Prisma model (if new entity)

Edit `packages/database/prisma/schema.prisma`:

```prisma
model MyModel {
  id        String   @id @default(cuid())
  weddingId String
  wedding   Wedding  @relation(fields: [weddingId], references: [id], onDelete: Cascade)
  // ...

  @@index([weddingId])
}
```

Then:
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Add the NestJS service + controller

In `apps/api/src/modules/weddings/` (or the relevant module):

```ts
// my-feature.service.ts
@Injectable()
export class MyFeatureService {
  constructor(private readonly db: PrismaService) {}

  async list(user: User) {
    const wedding = await this.db.weddingMember.findFirstOrThrow({ where: { userId: user.id } });
    return this.db.myModel.findMany({ where: { weddingId: wedding.weddingId } });
  }
}
```

Register in `weddings.module.ts` and add endpoints to `weddings.controller.ts`.

### 5. Add the API client method

In `packages/web/src/api/`:

```ts
// packages/web/src/api/wedding.ts
async myFeatureList(): Promise<MyModel[]> {
  return this.get('/weddings/mine/my-feature');
}
```

### 6. Build the UI

In `apps/web/src/app/[locale]/planning/my-feature/page.tsx`:

```tsx
"use client";
import { api } from "@ceylonweddings/web";
import { useWedding } from "../../../components/use-wedding";

export default function MyFeaturePage() {
  const { data } = useWedding();
  // ...
}
```

New shared components go in `packages/ui/src/domain/`.

### 7. Add i18n strings

In `packages/i18n/src/messages/en.json` (and `si.json`):
```json
{
  "myFeature": {
    "title": "My Feature",
    "empty": "Nothing here yet."
  }
}
```

Use with `useTranslations()`:
```tsx
const t = useTranslations();
<h1>{t("myFeature.title")}</h1>
```

### 8. Update docs

- If the feature adds routes: update `docs/INFORMATION_ARCHITECTURE.md`.
- If the feature adds API endpoints: update `docs/API_REFERENCE.md`.
- If the feature adds UI components: update `docs/UI_COMPONENTS.md`.
- If the feature changes the data model: update `docs/DATA_MODEL.md`.
- Update module status in `docs/MODULES.md` if the feature completes a module.

---

## Code style

- **TypeScript strict** everywhere. No `any`.
- **Zod validation** at every API boundary. Never trust raw request body.
- **No magic strings** for enums — import from `@ceylonweddings/contracts` or `@ceylonweddings/database`.
- **Money as integer LKR** at all times server-side.
- **Comments**: explain the *why*, not the *what*.
- **Imports**: use workspace aliases (`@ceylonweddings/ui`, `@ceylonweddings/web`, etc.) — not relative paths across package boundaries.

---

## Package dependency rules

```
apps/api     → packages/contracts, packages/database, packages/env
apps/web     → packages/contracts, packages/ui, packages/web, packages/i18n, packages/env
packages/web → packages/contracts
packages/ui  → (no domain packages — primitives only)
```

`apps/web` **must not** be imported by any `packages/*`.  
`packages/ui` **must not** import from `packages/web` or `apps/*`.

---

## Turbo pipeline

`turbo.json` defines the build order:

```
build: contracts → database → env → i18n → web(pkg) → ui → api, web(app)
dev:   all in parallel (watch mode)
```

Turborepo caches outputs — a clean cache rebuild: `pnpm turbo clean && pnpm dev`.
