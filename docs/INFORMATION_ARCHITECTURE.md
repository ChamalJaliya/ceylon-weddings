# Information Architecture

One public website. Role-based surfaces after login. Guest wedding pages have no dashboard chrome.

- **Site**: `apps/web` on port `3000`
- **API**: `apps/api` on port `4000` (Swagger: `/docs`)
- **Locales**: `en` | `si` | `ta` via `[locale]` route segment

---

## Chrome summary

| Surface | Chrome | Status |
|---------|--------|--------|
| Public (`/`, `/vendors`, `/vendors/[slug]`, login/register) | **TopNav** — marketing links when logged out; couple primary links when logged in | ✅ Implemented |
| Couple / family (`/planning/*`) | **TopNav** as primary; optional left sidebar on hub + budget | ✅ Implemented |
| Guest (`/w/[slug]`) | Chrome-light: language / currency / theme only | ✅ Implemented |
| Vendor Pro (`/pro/*`) | Left-rail `AppShell` | ✅ Implemented |
| Admin (`/admin/*`) | Left-rail `AppShell` + command palette (`⌘K`) | ✅ Implemented |

**TopNav primary slots (couple):** Planning · Calendar · Vendors · Budget · Ideas

**TopNav trail (right):** Inquiry popover · Notifications · Locale/Currency/Theme · Avatar menu

**Avatar overflow:** Profile · Guests · Family · Website · Team

---

## Routes

### Public (no login required)

```
/[locale]                           Marketing homepage + vendor search entry
/[locale]/vendors                   Vendor catalog (search, filter by category/district/price)
/[locale]/vendors/[slug]            Vendor storefront (gallery, packages, WhatsApp inquire)
/[locale]/w/[slug]                  Guest wedding website
/[locale]/w/[slug]/rsvp             Public RSVP
/[locale]/login                     Role-aware sign in
/[locale]/register                  Couple or vendor registration
/[locale]/about                     About page
/[locale]/how-it-works              How it works
/[locale]/for-vendors               Vendor acquisition page
/[locale]/faq                       FAQ
/[locale]/contact                   Contact
/[locale]/privacy                   Privacy policy
/[locale]/terms                     Terms of service
/[locale]/awards                    Ceylon Picks / award winners
```

**Public nav:** Home · Vendors · Plan a wedding · For vendors  
Language / currency / theme toggles stay on the current path.

---

### Couple and family (`COUPLE`, `FAMILY` roles)

All under `/[locale]/planning/`

```
/[locale]/planning                  Planning hub (countdown, KPIs, schedule, team, inquiries)
/[locale]/planning/profile          Wedding profile editor
/[locale]/planning/checklist        Task checklist
/[locale]/planning/calendar         Calendar week view
/[locale]/planning/budget           Budget (LKR, multi-payer, line items)
/[locale]/planning/vendors          → redirects to /vendors (shared marketplace)
/[locale]/planning/team             Shortlist / inquired / booked vendors
/[locale]/planning/guests           Guest households + per-event RSVP
/[locale]/planning/website          Wedding website copy + share URL
/[locale]/planning/family           Family tree + member invite
/[locale]/planning/seating          Seating chart (per-event)
/[locale]/planning/music            Music plans (per-event tracks + cues)
/[locale]/planning/moodboard        Visual mood boards
/[locale]/planning/messages         Support conversations
/[locale]/planning/agenda           Day-of agenda / run-of-show
/[locale]/planning/legal            Legal / registration helper
/[locale]/planning/studio           AI planning studio (stub)
```

---

### Vendor Pro (`VENDOR` role)

```
/[locale]/pro                       Leads snapshot + KPIs
/[locale]/pro/storefront            Edit listing (photos, packages, pricing, about)
/[locale]/pro/leads                 Inquiry inbox + WhatsApp deep-link
/[locale]/pro/promote               Promotion / ads studio
```

---

### Admin (`ADMIN` role)

```
/[locale]/admin                         Ops home (queue depths + KPIs)
/[locale]/admin/vendors                 All vendor listings (filter, search, bulk verify, CSV export)
/[locale]/admin/vendors/[id]            Listing detail + moderation actions + audit
/[locale]/admin/queues/verify           Verification queue
/[locale]/admin/queues/picks            Ceylon Picks queue (gate failures)
/[locale]/admin/queues/reports          Abuse / takedown inbox
/[locale]/admin/users                   All accounts (search, suspend, revoke sessions, CSV export)
/[locale]/admin/users/[id]              User detail + sessions
/[locale]/admin/weddings                Support wedding lookup (no guest PII in list)
/[locale]/admin/weddings/[id]           Read-only wedding snapshot
/[locale]/admin/inquiries               Cross-vendor lead oversight + force-close
/[locale]/admin/content                 Article CMS list
/[locale]/admin/content/[id]            Article editor (draft → publish → archive)
/[locale]/admin/reviews                 Review moderation (hide/unhide)
/[locale]/admin/ads                     Ads + promotion campaigns
/[locale]/admin/ads/[id]                Ads studio (creative · targeting · schedule · publish)
/[locale]/admin/featured                Legacy featured placement inventory
/[locale]/admin/audit                   Global searchable audit trail
/[locale]/admin/settings                Platform settings overview
/[locale]/admin/settings/site           Branding + homepage + SEO (`SiteConfig`)
/[locale]/admin/settings/pages          Static CMS pages (about/faq/terms/privacy/contact)
/[locale]/admin/settings/pages/[slug]   CMS page editor
/[locale]/admin/settings/flags          Feature flag catalog (gates public surfaces)
/[locale]/admin/settings/awards         Awards nominations → public `/awards`
```

`⌘K` in admin opens the command palette.

Public marketing copy for home, about, faq, terms, privacy, contact, and awards is driven by Settings (`SiteConfig` / `CmsPage` / awards APIs). Ideas articles and ad rails stay under Content / Ads.

---

### Public creative tools (no auth)

```
/[locale]/ideas                     Editorial / inspiration hub
/[locale]/ideas/[slug]              Individual article
/[locale]/moodboard                 Public moodboard viewer (token-based)
/[locale]/music-brief               Public music brief viewer (token-based)
```

---

## Route auth guards

| Route prefix | Guard |
|-------------|-------|
| `/planning/*` | `COUPLE` or `FAMILY` session |
| `/pro/*` | `VENDOR` session |
| `/admin/*` | `ADMIN` session |
| `/w/[slug]` | None — public |
| `/public/*` (API) | None — public |
| All other routes | None — public |

Route auth is enforced at the Next.js middleware level (`src/middleware.ts`) and double-checked at the API layer (`JwtCookieGuard`).

---

## Mobile (future)

`/[locale]/*` routes will eventually be mirrored in `apps/mobile` (Expo). The shared `packages/contracts` and `packages/web` API client enable this without duplicating business logic.
