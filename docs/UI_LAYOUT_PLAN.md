# UI layout plan — Knotly chrome, Ceylon product

**Chrome reversal (2026-08-14, later the same day):** restore the previous **left side nav** (`AppShell` / `PlanningShell`). TopNav-first couple chrome stacked with PreferenceBar / the inner `AppHeader` (“two headers”) and broke UX. Logged-in couple / vendor / admin use the left rail again; public `/` and `/vendors` keep a **single** PublicHeader (logo + catalog + login); guest `/w/[slug]` stays chrome-light. Calendar, Ideas, catalog, messages, and writable checklist/budget stay — only the competing top pill nav was removed.

Status: **approved — user chose all** (2026-08-14). Implement in this drop: TopNav, real week calendar, full hub (widgets + cinematic/profile), Ideas in nav, and all seven Knotly screens.

Brand stays **Ceylon Weddings**. Knotly is the layout reference (density, card language, photography-forward catalog), not a clone and not a rename.

This plan is layout/UX only. Another stream may still be closing MVP functional gaps (task/budget writes, per-event RSVP, family permissions, event editor, route auth). **Do not rewrite those flows.** Wrap them in the new chrome.

Related docs (unchanged by this file):

- `docs/INFORMATION_ARCHITECTURE.md` — current routes
- `docs/MVP_MODULES.md` — nine v1 modules; inspiration and nekath run-of-show are not MVP
- `docs/CORE_MODULES.md` — Sri Lanka constraints this layout must honor

Visual map (open beside chat): [Knotly → Ceylon UI map](/Users/chamal/.cursor/projects/Users-chamal-Desktop-CeylonWeddings/canvases/knotly-ui-layout-map.canvas.tsx)

---

## Constraints we keep

Sri Lanka first. One public site (guest + couple + vendor + admin). WhatsApp-native. Multi-event (poruwa / church / nikah / walima / homecoming). LKR stored, multi-currency display. Family roles. EN + SI.

**Take from Knotly:** top chrome, density, rounded photography cards, catalog grid, vendor detail split, budget sidebar + charts, dashboard widgets, week calendar grid, ideas editorial layout.

**Do not take as core v1:** in-app Messenger, USD-only, US categories (Officiant vs registrar / poruwa), Ideas as a required content flywheel, AI Assistant, Meet-now scheduling, Venmo / registry.

---

## Chrome decision (supersedes left-rail-first couple shell)

Today couple / pro / admin use a persistent **left rail** (`AppShell` in `packages/ui` + `dashboard-shell.tsx`). Public already has a Knotly-like **top pill header**. Guest `/w/[slug]` is chrome-light.

Knotly’s wow is the **shared top nav**, not a 15.5rem sidebar on every planning page.

| Surface | Chrome |
| --- | --- |
| Public (`/`, `/vendors`, `/vendors/[slug]`, login/register) | Shared **TopNav**. Marketing links when logged out; couple primary links when a couple/family session exists. |
| Couple / family (`/planning/*`) | Same **TopNav** as primary chrome. Optional **page-level left sidebar** only on hub and budget. |
| Guest (`/w/[slug]`) | Unchanged: language / currency / theme only. No dashboard chrome. |
| Vendor Pro (`/pro/*`) and Admin (`/admin/*`) | Keep current left-rail `AppShell` in Phase A. Out of this layout pass. |

**Couple TopNav (primary, 5 slots like Knotly):**

| Knotly | Ceylon label | Route | Phase |
| --- | --- | --- | --- |
| Dashboard | Planning | `/planning` | A |
| Calendar | Checklist | `/planning/checklist` | A (list). Week grid = B / v1.5 |
| Catalog | Vendors | `/vendors` | A — one marketplace, not a second catalog at `/planning/vendors` |
| Cost Guide | Budget | `/planning/budget` | A (hide if `!canViewBudget`) |
| Ideas | omit from v1 nav | `/inspiration` later | C lite, then v2 editorial |

**Trail (right):** inquiry popover (WhatsApp list, not Messenger) · notifications (can stay dormant) · locale / currency / theme · avatar menu.

**Overflow (avatar or “More”):** Profile, Guests, Family, Website, Team. These stay in IA; they are not five extra top-nav icons.

`/planning/vendors` becomes a redirect to `/vendors` (logged-in TopNav already covers it). Do not maintain two catalog pages.

---

## 1. Screen-by-screen

### 1. Couple dashboard home (Knotly welcome + widgets)

**Copy**

- Greeting: “Welcome {PartnerOne} & {PartnerTwo}” with remaining-task count.
- Compact budget chip (spent vs planned, categories hired / vendors booked).
- Two-column body: left = schedule + “My vendors”; right = countdown card + inquiry list + upcoming.
- Color-coded event/task chips, “View all” links, generous card radius.

**Localize**

- Countdown is to the **next Event**, not a single US wedding day. Chips for poruwa / church / nikah / walima / homecoming.
- “Messenger” → **Inquiries** with last WhatsApp snippet + deep link. No in-app chat composer.
- Schedule widget in Phase A is **checklist tasks + Event starts**, not a fake week calendar.
- Money via existing `formatMoney` + preference currency (LKR default).
- Family: budget chip respects `canViewBudget`.

**Current code:** `/planning` already has `CoupleHero` + KPI `StatCard`s + `TimelineRail` + `BudgetMeter`. Phase A **replaces the cinematic full-bleed hub** with Knotly widget density. Keep `CoupleHero` for marketing home and guest `/w/[slug]`.

**Optional left sidebar (from the style/inspiration dashboard shot):** couple avatar, names, city, short bio, photo countdown, top budget categories. Use this on `/planning` only — not on every inner page.

---

### 2. Dashboard style + inspiration (Knotly Wedding / Saved / Vendor Team)

**Copy**

- Photography banner behind a profile card.
- Style / setting / color summary.
- Image-forward “inspiration” tiles (flowers, photographer, cake, DJ…).

**Localize / cut**

- **AI Assistant button: drop.**
- Style quiz + 5×2 editorial grid is **not MVP** (`docs/MVP_MODULES.md`). Phase A hub uses **Vendor Team** tiles (booked / shortlisted from `WeddingVendor`) instead of a mood-board CMS.
- Style/setting/colors can be a compact read-only strip from wedding profile fields if they exist; no new quiz API.
- Saved / boards → Phase C lite or v2.

---

### 3. Catalog / marketplace

**Copy**

- Page title “Vendors” (serif) + wide rounded search.
- Horizontal **category pills** (View all + SL categories + More).
- 3-column **triptych cards**: three rounded photos, overlapping vendor avatar, centered name, star + city, price pill + category pill.
- Inquiry icon in TopNav with a list popover (layout only; rows are existing `Inquiry` records).

**Localize**

- Categories from existing taxonomy (`VENUE`, `PORUWA`, `ASTROLOGY`, `BRIDAL_DRESSER`, `REGISTRAR`, `MEHNDI`, …) — not Photography / Officiant / US cakes-only.
- Price pill: LKR + display currency, “Ask for price” when `startingPriceLkr` is null.
- Location: `{city}, {district}` (Sri Lanka), not “California, USA”.
- “See all in Messenger” → “Open WhatsApp” / “View inquiries”.
- Search can be name + city client filter in Phase A; full-text later.

**Current code:** `/vendors` and `/planning/vendors` share a single-photo `VendorCard` + `<select>` filter. Replace the card and the select; unify the two routes.

**Photo gap:** Vendor only has `photoUrl`. Phase A triptych = hero photo + two muted / repeated tiles. Do **not** block layout on a gallery migration. Gallery URLs are a later data change, out of this UI pass unless the functional stream already adds them.

---

### 4. Vendor details

**Copy**

- Split layout: gallery + about on the left; sticky conversion column on the right.
- Gallery: large featured image + stacked thumbs (triptych language).
- Tabs: About (active), Pricing, Location. FAQs optional empty-state later.
- Identity row: avatar, name, city/district, stats (verified, years/styles, destination flag).
- Right: studio name, primary CTA, secondary CTA, starting-price / packages, socials if present, map placeholder.

**Localize**

- Primary CTA: **WhatsApp inquire** (existing `whatsappUrl` / `wa.me` flow), not “Message Matt”.
- Secondary: **Request quote** (existing inquiry form).
- **Meet now / Meet later / time-slot chips: drop.**
- Reviews tab and 6-criteria bars: **v2** (reviews are not MVP). Show verified / featured badges only.
- Packages: if we have no package model, one “From {price}” card + styles list — do not invent three USD tiers.
- “On Knotly since” → “Verified on Ceylon Weddings” when `verified`.
- Background: pearl/temple/night tokens, not Knotly’s pink–purple gradient.

**Current code:** `/vendors/[slug]` is a page header + one image + about card + inquire card. Same data, new split.

---

### 5. Cost Guide / budget

**Copy**

- Left sidebar: “+ New category” + category rows (icon, name, total, chevron).
- Main: Estimated vs Final/Spent summary cards, category bar chart, expense table (item, estimated, spent, paid) with row menu.

**Localize**

- Column model matches `BudgetLine`: **Planned / Spent / Payer** (couple, bride family, groom family). “Paid / pending” only if the functional stream already stores it; otherwise Spent = paid-to-date and skip a fake pending column.
- Chart colors = `--chart-1` … `--chart-5`, not Knotly pastels.
- Amounts: integer LKR in API, `formatMoney` in UI.
- Honor `canViewBudget`.
- Categories: venue + catering, photo/video, attire, jewellery, poruwa / traditional, beauty, cake, cars, invitations — not “Favors and Gifts” as a default SL set.
- Keep the existing add/edit write form; restyle it into sidebar “new line” + row actions. **Do not replace the write API.**

---

### 6. Calendar week view

**Copy (Phase B / v1.5)**

- Title + Today + week range + Month / Week / Day toggle.
- 7-day grid with time gutter; pastel event blocks; current-day header; search + add.
- Right agenda list; event sheet with time, place, reminder.

**Localize**

- Blocks are **Tasks with due dates** and **Events** (poruwa, church, nikah…), color by `EventKind` / task category.
- Optional **nekath marker** on the ceremony Event (a labeled block), not a US 4pm template and not a full day-of run-of-show (explicitly not MVP).
- “+ Add a meeting” → “+ Add task” (existing create-task).
- Event sheet “Message” → WhatsApp if a vendor is linked; otherwise omit.
- **v1 (Phase A):** no week grid. Checklist stays a list; hub schedule widget is a single-day rail of upcoming tasks/events.

---

### 7. Ideas / editorial

**Copy (Phase C lite)**

- Serif title + short intro + search + hero photo.
- Circular category icons.
- Featured story + stacked list.

**Localize / cut**

- Not a required MVP flywheel (`docs/MVP_MODULES.md`, `CORE_MODULES` §11).
- Lite: 6–8 static cards that deep-link to `/vendors?category=` (Poruwa, Bridal dresser, Nekath, Cake, Cars, Mehndi). EN + SI titles.
- No CMS, no “Search Knotly articles”, no US fashion editorial.
- Full real-wedding magazine = v2.

---

## 2. Target information architecture

Routes in `docs/INFORMATION_ARCHITECTURE.md` stay. Only chrome and one redirect change.

```
Public
  /[locale]                      Marketing
  /[locale]/vendors              Marketplace (shared TopNav)
  /[locale]/vendors/[slug]       Storefront
  /[locale]/w/[slug]             Guest site (chrome-light)
  /[locale]/w/[slug]/rsvp        RSVP
  /[locale]/login | register

Couple / family (TopNav)
  /[locale]/planning             Hub (optional left sidebar)
  /[locale]/planning/checklist   Tasks (Calendar slot in nav)
  /[locale]/planning/budget      Budget (optional left sidebar)
  /[locale]/planning/profile     Overflow
  /[locale]/planning/guests      Overflow
  /[locale]/planning/family      Overflow
  /[locale]/planning/team        Overflow
  /[locale]/planning/website     Overflow
  /[locale]/planning/vendors     Redirect → /vendors

Later
  /[locale]/planning/calendar    Phase B week grid
  /[locale]/inspiration          Phase C lite
```

Public TopNav links (logged out): Home, Vendors, Plan a wedding, For vendors — same as today, restyled to match the couple TopNav so the site feels like one product.

Mobile: TopNav collapses to logo + hamburger (primary 5 + overflow) + avatar. Budget/hub sidebars stack above main content.

---

## 3. Visual system (tokens, not Knotly blue)

Do not introduce a Knotly blue hex. Map the *feel* onto existing pearl / temple / night.

| Knotly | Ceylon |
| --- | --- |
| Soft blue active pill | `--secondary` / `--info` fill, `--info` text (pearl already has a cool teal-blue secondary) |
| Primary action blue | Stay `--primary` (gold / temple saffron / night gold) so the brand does not become a US planner |
| White cards on grey-blue canvas | `--card` on `--background` (pearl ivory is already close) |
| Pastel event chips | `--info`, `--success`, `--love`, `--warning`, `--chart-*` at ~15% fill |
| Serif page titles | Existing `--font-serif` (Cormorant Garamond) — use on Catalog / Budget / Planning titles the way Knotly uses serif on Ideas |
| 16–24px radius | `--radius` is already `1rem`. Bump catalog/vendor cards toward `rounded-2xl` / `rounded-3xl` via card contract, not one-off hex |
| Soft shadow | Existing `--elevation-card` / `shadow-card` |
| Photography-forward | Triptych + countdown image + guest/marketing heroes |

Temple and night keep the same components; only tokens swap. No pink–purple page gradients.

Existing pieces to **reuse**, not rebuild: `Card`, `Button` (`shape="pill"`), `Badge`, `PageHeader`, `StatCard`, `TimelineRail`, `BudgetMeter` (evolve), `VendorCard` (replace internals), `AppHeaderSearch`, `PreferenceControls`, `AuthNav`.

---

## 4. Component inventory (`packages/ui`)

Domain composites live in `packages/ui/src/domain/`. Apps compose; they do not invent radius or color.

| Component | Phase | Role |
| --- | --- | --- |
| `TopNav` | A | Logo, primary links with icon + active pill, trail slots. Replaces couple left rail. Unifies `PublicHeader`. |
| `InquiryPopover` | A | Inquiry rows + WhatsApp CTA. Layout around existing `Inquiry`. |
| `CategoryPills` | A | View all + categories + More. Used on `/vendors` and Ideas lite. |
| `VendorTriptychCard` | A | Replaces `VendorCard` media; keep name/rating/location/price API. |
| `VendorGallery` | A | Featured + stacked thumbs on `/vendors/[slug]`. |
| `VendorTabs` | A | About / Pricing / Location (Reviews disabled until v2). |
| `InquirePanel` | A | Sticky quote + WhatsApp. No meet-now. |
| `HubSidebar` | A | Optional left column on `/planning`: couple, countdown, budget cats. |
| `CountdownCard` | A | Photo + next Event date + live D:H:M:S. |
| `ScheduleWidget` | A | Compact day rail of tasks/events (not WeekCalendar). |
| `SupplierStrip` | A | Booked/shortlist photo tiles → `/planning/team` or storefront. |
| `BudgetSidebar` | A | Category list + add line. |
| `BudgetSummaryPair` | A | Planned vs spent cards (extends `StatCard` language). |
| `BudgetBarChart` | A | Category spend; `chart-*` tokens. Lightweight (CSS bars or existing chart token colors). No new chart library unless already in the repo. |
| `ExpenseTable` | A | Planned / spent / payer + row actions wrapping current edits. |
| `WeekCalendar` | B | Mon–Sun grid, time gutter, `CalendarEventBlock`, agenda list, event sheet. |
| `InspirationHero` + `EditorialSplit` | C | Title/search/photo + feature/list. Static cards OK. |

**Evolve in place:** `AppShell` stays for Pro/Admin. `CoupleHero` stays for marketing + guest. `BudgetMeter` can power hub chip + sidebar totals.

---

## 5. Phased build

### Phase A — must (chrome + hub + catalog + vendor + budget)

Aligns with MVP modules 2, 4, 5.

1. `TopNav` + couple chrome switch; public header unification; `/planning/vendors` → `/vendors`.
2. `VendorTriptychCard` + `CategoryPills` on `/vendors`.
3. Vendor detail split + `InquirePanel` (existing WhatsApp inquire).
4. Budget sidebar + summary + table (+ simple bars) around existing budget writes.
5. Planning hub widgets (greeting, countdown, schedule rail, supplier strip, inquiries, upcoming). Optional `HubSidebar`.
6. Token/radius softening only as needed for the above.

**Out of Phase A:** week calendar, Ideas CMS, reviews, meet-now, Messenger, Pro/Admin restyle.

### Phase B — calendar (v1.5)

Week/day grid on `/planning/calendar` (or checklist view switch). Color by `EventKind`. Nekath as a labeled marker on the ceremony Event. Add-task uses existing task API. **Not** day-of run-of-show.

Until B ships, TopNav “Checklist” remains the Calendar analogue.

### Phase C — ideas lite

`/inspiration` with category circles → vendor filters and a handful of static EN/SI cards. Full editorial / real weddings / style quiz = v2.

---

## 6. Explicit non-goals

- Renaming the product or copying Knotly’s logo / blue brand.
- In-app Messenger or replacing WhatsApp.
- AI Assistant, Meet-now scheduling, Venmo / registry / cash-gift tracker.
- Reviews, paid featured marketplace UX, seating.
- US category names as defaults.
- Ideas as a required v1 content engine.
- Nekath-generated day-of run-of-show (v2).
- Tamil UI as a required layout track (catalog can exist; copy can lag).
- Restyling `/pro` and `/admin` in this pass.
- Guest `/w/[slug]` dashboard chrome.
- New gallery / packages / reviews APIs as blockers for Phase A.
- Fighting the concurrent MVP functional work (rewriting task/budget writes, RSVP, family ACL, event editor, route gates).

---

## 7. Implementation order (after approval)

Layout-only. Prefer `packages/ui` first, then `apps/web` composition. Leave API/Prisma alone unless a field is already there.

1. **TopNav + chrome** — `packages/ui` `TopNav`; `app-chrome` / `public-chrome` / `PlanningShell` drop couple left rail; keep Pro/Admin rail; guest unchanged.
2. **Catalog** — pills + triptych; unify `/vendors`; redirect `/planning/vendors`.
3. **Vendor detail** — gallery + tabs + sticky inquire (WhatsApp).
4. **Budget layout** — sidebar + summary + table wrapping current create/update.
5. **Hub widgets** — greeting, countdown, schedule, suppliers, inquiries; retire full-bleed `CoupleHero` on `/planning` only.
6. **Polish** — radius/title density; EN+SI strings for new chrome labels.
7. **Stop and demo Phase A.** Then B (week calendar), then C (inspiration lite).

Suggested first PR after approval: step 1 only (chrome). Catalog and hub can follow in separate PRs so they do not collide with functional budget/task work.

---

## Open questions — answered 2026-08-14 (“i want all”)

1. Couple chrome: **TopNav** (Knotly chrome), not left-rail-only. Pro/Admin keep the rail.
2. Calendar in the top nav: **real week calendar now** at `/planning/calendar`. Do not hide it and do not use Checklist as a fake Calendar slot.
3. Hub: **all of it** — Knotly widgets AND cinematic/profile pieces (welcome, countdown, budget, schedule, suppliers, messages, upcoming tasks, style/palette). Not one or the other.
4. Ideas/Inspiration: **in the top nav now** (`/ideas` + `/ideas/[slug]`), not overflow-only.

Primary couple nav: Dashboard · Calendar · Catalog · Cost Guide · Ideas. Checklist / Guests / Website / Family / Team live in the avatar menu and dashboard links.
