# Admin platform

Status: implemented (Waves A–E foundation + site control hub)

## Surface

Admin is a role on `apps/web` (`/[locale]/admin/*`), not a separate app. Nest routes live under `AdminModule` at `/admin/*`.

## Auth & trust

- Only `User.role === ADMIN` may call admin APIs (`AdminAccessService.assertAdmin`).
- `User.status === SUSPENDED` blocks login and JWT guard.
- Logout deletes the refresh `Session` row.
- Mutating admin actions write `AuditLog`.

## Core capabilities

| Area | Behavior |
| --- | --- |
| Ops home | Queue depths + KPI stats, analytics summary, email job health |
| Vendors | Filter/search, detail, verify/feature/hide with notes, presentation gate, bulk verify, CSV export |
| Queues | Verify, Ceylon Picks (gate failures), Reports inbox |
| Users | Search, suspend/reactivate, revoke sessions, impersonation audit stub, CSV export |
| Weddings | Read-only support lookup (no guest PII dump in list) |
| Inquiries | Cross-vendor oversight + force-close |
| Content | Article CMS draft/publish/archive/feature |
| Reviews | Hide/unhide from public storefronts |
| Featured | `FeaturedPlacement` schedule (editorial/comped/paid-pending) |
| Settings | Tabbed hub: overview, site/homepage branding, CMS pages, curated feature flags, awards workflow |
| Audit | Global searchable trail |

## Settings hub

| Route | Controls |
| --- | --- |
| `/admin/settings` | Overview + links to Content/Ads/Featured + maintenance shortcut |
| `/admin/settings/site` | `SiteConfig` branding + homepage hero/stats/categories/how-it-works/SEO |
| `/admin/settings/pages` | `CmsPage` list/editor for about, faq, terms, privacy, contact |
| `/admin/settings/flags` | Catalog toggles (`reviews.enabled`, `awards.public`, `ideas.public`, `ads.public`, `site.maintenance`) + custom keys |
| `/admin/settings/awards` | Nominate vendors; set `NOMINATED` / `SHORTLISTED` / `WINNER` / `REJECTED` |

Public read APIs (no auth): `GET /public/site-config`, `GET /public/pages/:slug`, `GET /public/flags`, `GET /public/awards?year=`.

## Contracts

Zod schemas live in `packages/contracts/src/admin/*` (including `site-config.ts`). Client: `api.admin.*` and `api.site.*` in `@ceylonweddings/web`.

## Deferred (Wave E product wiring)

- Full PayHere/Stripe checkout for paid featured
- Cookie-swapping impersonation UI (audit endpoint exists)
- Admin TOTP challenge UI (`totpSecret` / `totpEnabled` columns exist)
- Fine-grained capability enforcement beyond optional `IMPERSONATE` check
