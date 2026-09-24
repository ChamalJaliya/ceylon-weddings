# Ceylon Weddings — Knotly-inspired product UI

Brand stays **Ceylon Weddings**. Visual language is Knotly’s light, pill-nav, card-shadow layout, localized for Sri Lanka (LKR, WhatsApp, multi-event, districts, EN+SI). One public site `apps/web` + Nest `apps/api`.

This is a **product** plan (features + IA + data + layout), not a pixel copy of the seven screenshots.

---

## 1. What the screens actually sell

| Screen | Job to be done | Ceylon route |
| --- | --- | --- |
| Dashboard (schedule/suppliers) | Answer “where are we, what’s next, who is booked?” | `/planning` |
| Dashboard (profile/style) | Taste, palette, inspiration, vendor team | `/planning` tab **Style** |
| Calendar | Time-box vendor work + ceremony/nekath | `/planning/calendar` |
| Cost Guide | Estimated vs cap vs paid, by category | `/planning/budget` |
| Catalog | Discover SL vendors | `/vendors` |
| Vendor details | Trust + WhatsApp inquire + packages | `/vendors/[slug]` |
| Ideas | Editorial SEO + planning inspiration | `/ideas`, `/ideas/[slug]` |

Secondary planning (already real, keep under the same chrome): checklist, guests/RSVP, profile+events, family flags, website, team. `/pro` and `/admin` keep their jobs with the same top-nav visual system.

---

## 2. Information architecture

### Logged-in couple/family chrome (Knotly 5 + utilities)

Top bar, not left rail:

- Logo **CW · Ceylon Weddings**
- Pill nav: **Dashboard** `/planning` · **Calendar** `/planning/calendar` · **Catalog** `/vendors` · **Cost Guide** `/planning/budget` · **Ideas** `/ideas`
- Right: Messages (inquiry threads → `wa.me`) · Notifications (upcoming appointments + open tasks) · Avatar menu (profile, guests, family, website, checklist, sign out)

Background: soft wash (pearl = cool white/lilac, temple = warm, night = existing dark). Generous radius, white cards, soft blue active pill.

### Public / guest chrome

Lighter header: Home, Catalog, Ideas, Plan a wedding, Sign in. Catalog and Ideas stay public SEO. Guest wedding site `/w/[slug]` stays minimal (no product nav).

### Role gates (fold previous MVP)

- `/planning/*` → COUPLE, FAMILY (anonymous → `/login`)
- `/pro/*` → VENDOR (ADMIN may view)
- `/admin/*` → ADMIN
- Public: `/`, `/vendors`, `/ideas`, `/w/[slug]`, login/register

Vendor `/pro` nav: Dashboard, Storefront, Leads. Admin: Dashboard, Vendors, Users.

---

## 3. Feature map by surface

### 3.1 Dashboard `/planning`

**Home tab (schedule/suppliers shot)**

- Welcome `{partnerOne} & {partnerTwo}` + remaining task count
- Budget total widget (hide if `!canViewBudget`) + “categories hired” (booked team / SL vendor categories)
- Day/month schedule strip, timezone **GMT+5:30** — appointments + ceremony events
- My suppliers: team cards (photo, category) → `/planning/team` / vendor slug
- Countdown to wedding date (or TBD / next nekath)
- Messages widget: last inquiries; CTA opens WhatsApp when vendor has a number
- Upcoming tasks: checkbox completes task (`PATCH` status DONE), tags from `category`

**Style tab (profile/style shot)**

- Compact couple card + Edit profile → `/planning/profile`
- Style chips: Minimalist / Traditional / Kandyan / Modern / Beach (SL palettes, not US rustic)
- Color swatches stored on wedding
- Inspiration grid by vendor category → catalog filtered
- Saved (shortlisted team) · Vendor Team

**AI Assistant (stub only)**

- Button opens a panel with 3 canned SL prompts that deep-link:
  1. Nekath + poruwa checklist → `/planning/checklist`
  2. Find a Colombo/Kandy venue → `/vendors?category=VENUE`
  3. Split budget across families → `/planning/budget`
- No LLM. Copy states this is a guided helper.

Checklist writes stay on dashboard checkboxes **and** `/planning/checklist`.

### 3.2 Calendar `/planning/calendar`

- Views: **Week (default)**, Month, Day
- Search titles; **Add appointment**
- Color-coded blocks: vendor meeting, tasting, fitting, ceremony (nekath/poruwa/church/nikah)
- Popover: time, venue, reminder, Message (WhatsApp if linked vendor), cancel/delete
- Right rail: chronological list for the selected day
- Seed a week of Nimali & Kasun appointments around **14–20 Aug 2026** plus Dec 12 ceremony blocks so “today” is not empty

### 3.3 Cost Guide `/planning/budget`

- Left: category list with LKR totals + add category (creates a budget line)
- Summary: estimated (`sum plannedLkr`) vs cap (`wedding.budgetLkr`); spent vs paid (`spentLkr` / `paidLkr`); pending = spent − paid
- CSS/SVG bar chart by category (no chart library)
- Table: name, estimated, final/spent, paid, payer, row edit
- Writes: add/edit lines, payer pots, mark paid — closes read-only budget
- Enforce `canViewBudget` (403 + hide nav)

### 3.4 Catalog `/vendors`

- Search + SL category chips (venues, photo, poruwa, astrologer, dresser, …)
- Cards: 3-photo strip, avatar, name, **seeded rating**, city/district, starting LKR, category
- Header Messages popover = inquiry list (couple) or “sign in to inquire”

### 3.5 Vendor details `/vendors/[slug]`

- Photo gallery (1 large + strip)
- Tabs: About, FAQs, Reviews, Pricing, Location
- Stats: rating, couples served, years, review count (seed fields)
- Included-in-starting-price checklist
- Reviews: overall + dimension bars; **write review** if couple/family and they have an inquiry or booked link
- Sidebar: WhatsApp Message + Request pricing (inquiry + optional preferred date)
- Pricing tiers Basic / Advanced / Dream in LKR
- Location: Google Maps search link for `{city}, {district}, Sri Lanka` (no GDS)
- Meet now/later simplified to preferred date on the inquiry form

### 3.6 Ideas `/ideas`

- Hero + search
- Category icon row localized (flowers, ceremony, cakes, cars, fashion, beauty, family, events)
- Featured article + list
- Seed 8 SL articles (nekath etiquette, poruwa vs homecoming dress, Colombo vs south coast, diaspora travel, halal walima, Kandyan jewellery, mehndi night, church banns)
- Public SEO: `/ideas`, `/ideas/[slug]`

### 3.7 Folded MVP (do not drop)

1. Checklist writes  
2. Per-event guest RSVP (`/planning/guests`, `/w/[slug]/rsvp`)  
3. WeddingMember flags on mutations  
4. Profile events + types + culture-aware task seed  
5. Route guards  

WhatsApp inquire stays. Auth stays email/password cookies. No in-app chat. No real AI.

---

## 4. Data model deltas

New migration `knotly_features` (do not rewrite `core_domain`).

**Wedding:** `style` (MINIMALIST | TRADITIONAL | KANDYAN | MODERN | BEACH), `styleNotes`, `settingNotes`, `colors String[]`

**BudgetLine:** `paidLkr Int @default(0)`

**Vendor:** `photos String[]`, `yearsExperience Int?`, `couplesServed Int?`, `ratingAvg Float @default(4.8)`, `ratingCount Int @default(0)`, `includedInPrice String[]`, `instagram String?`, `facebook String?`, `faqs Json?`

**VendorPackage:** `id`, `vendorId`, `tier` BASIC | ADVANCED | DREAM, `name`, `priceLkr`, `description`

**Review:** `vendorId`, `weddingId?`, `authorName`, `rating`, `quality`, `professionalism`, `flexibility`, `responseTime`, `value`, `communication`, `body`, `recommended`, `createdAt`  
Unique enough in seed; v1 write requires logged-in couple/family with inquiry or booked link.

**Appointment:** `weddingId`, `title`, `kind` VENDOR_MEETING | TASTING | FITTING | CEREMONY | OTHER, `startsAt`, `endsAt`, `venueName?`, `address?`, `reminderMinutes`, `vendorId?`, `notes?`, `color?`

**Article:** `slug`, `title`, `excerpt`, `body`, `category`, `coverUrl`, `locale`, `featured`, `publishedAt`

**Inquiry:** `preferredDate DateTime?`

Existing Task / Event / EventInvite / WeddingMember flags stay.

---

## 5. APIs (Nest + contracts + `packages/web` client)

Keep existing wedding/guest/task/budget/event/member routes.

Add:

- `GET/POST /weddings/mine/appointments`, `PATCH/DELETE /weddings/mine/appointments/:id`
- Budget `paidLkr` on POST/PATCH
- `GET /weddings/mine/inquiries` (messages widget)
- `GET /articles?category&q`, `GET /articles/:slug`
- `GET /vendors/:slug` returns packages, reviews, faqs, photos, stats
- `POST /vendors/:id/reviews` (auth + inquiry/booked)
- `POST /weddings/mine/inquiries` accepts `preferredDate`
- `PATCH /weddings/mine` accepts style/colors

Permission flags unchanged.

---

## 6. UI implementation notes

- Restyle **pearl** toward Knotly soft-blue accents; temple/night remain Ceylon variants.
- Prefer CSS in `apps/web/src/app/globals.css` + composed components in `apps/web/src/components` (`product-chrome`, `catalog-card`, `week-grid`, `cost-bars`, `ai-stub`, `messages-popover`).
- Reuse `@ceylonweddings/ui` Button, Card, Badge, Input, NativeSelect, Popover.
- i18n EN + SI for new chrome/labels; TA mirrors EN.
- Calendar uses CSS grid; cost chart uses div bars.

---

## 7. Seed

Unchanged logins: `couple@` / `vendor@` / `admin@` / `family@` · `Password123!`

Expand Nimali & Kasun: style Kandyan + palette, appointments this week + Dec ceremony, paidLkr on lines, packages + reviews on Lotus/Glen/Kandy Hills, 8 articles, extra vendor photos.

---

## 8. Out of scope (still deferred)

Seating charts, payments/escrow, real LLM, in-app chat replacing WhatsApp, Google Maps embed/GDS, Google/OTP auth, couple/vendor/admin stub apps.

---

## 9. Build / verify

Migrate `knotly_features`, seed, typecheck/build api+site, kill :3000/:4000, `pnpm start`. Smoke: `/health` 200, `/en` 200, `/en/planning`, `/en/planning/calendar`, `/en/planning/budget`, `/en/vendors`, `/en/ideas`, login still works.
