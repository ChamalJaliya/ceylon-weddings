# UI Components

All UI lives in `packages/ui`. `apps/web` composes components; it does not define its own primitives.

---

## Design system

### Tokens

The full contract lives in [packages/ui/STYLEGUIDE.md](../packages/ui/STYLEGUIDE.md). `pnpm lint` (`scripts/check-design-system.mjs`) fails CI on any bypass.

| Layer                 | File                                             | Examples                                                                                   |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Primitives (only hex) | `styles/tokens.css`                              | `--cw-gold-600`, `--cw-maroon-700`, `--cw-jade-700`, `--cw-night-950`                      |
| Semantic              | `styles/tokens.css`                              | `--color-primary`, `--color-text-muted`, `--color-bg-card`, `--color-success-subtle`       |
| Component             | `styles/tokens.css`                              | `--button-radius`, `--field-height`, `--modal-padding`, `--shadow-dock`                    |
| Theme bridge          | `styles/theme.css`                               | shadcn names (`--primary`, `--muted-foreground`) + Tailwind `@theme inline`                |
| Density               | `styles/density.css` + `lib/responsive-tiers.ts` | compact / dense / phone control heights and type                                           |
| Component CSS (BEM)   | `styles/components/*.css`                        | `.button--primary`, `.field--sm`, `.card--interactive`, `.badge--success`, `.modal__title` |

Themes: pearl (default), temple, night — they reassign semantic tokens only.
Type scale: `text-display`, `text-h1`–`text-h4`, `text-body-lg`, `text-body`, `text-compact`, `text-caption`, `text-label`. Two weights: `font-normal`, `font-medium`.

### Themes

| Theme    | Character                                                                       |
| -------- | ------------------------------------------------------------------------------- |
| `pearl`  | Ivory paper, champagne-gold primary, peacock-jade secondary and focus. Default. |
| `temple` | Sandalwood surfaces, kumkum-maroon primary, gold accents.                       |
| `night`  | Warm ink canvas, cream text, gold-leaf primary.                                 |

All three themes use the same component tree — only CSS custom property values change.

### Typography (Google Fonts)

| Variable            | Font               | Use                            |
| ------------------- | ------------------ | ------------------------------ |
| `--font-geist-sans` | Geist Sans         | Body, UI labels                |
| `--font-display`    | Cormorant Garamond | Display / cinematic titles     |
| `--font-serif-mood` | Source Serif 4     | Section headings, editorial    |
| `--font-script`     | Great Vibes        | Couple names, romantic accents |

---

## Primitive components (`packages/ui/src/components/`)

Radix-based primitives. Import path: `@ceylonweddings/ui/components/[name]`.

| Component      | Notes                                                                                                                                                                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`       | Variants: default, outline, ghost, destructive. `shape="pill"` for rounded. Optional Lucide `icon` / `iconLeft` / `iconRight` (ignored with `asChild` — put `<Icon>` inside the child). Hovering the button plays nested icon GIF loops.                                                                                      |
| `Heading`      | `h1`–`h6` serif titles. Optional Lucide `icon` that GIF-animates on heading hover.                                                                                                                                                                                                                                            |
| `Badge`        | Status chips with tone.                                                                                                                                                                                                                                                                                                       |
| `Card`         | Surface container with `CardHeader`, `CardContent`, `CardFooter`.                                                                                                                                                                                                                                                             |
| `Input`        | Styled text input.                                                                                                                                                                                                                                                                                                            |
| `Textarea`     | Styled textarea.                                                                                                                                                                                                                                                                                                              |
| `Label`        | Form label.                                                                                                                                                                                                                                                                                                                   |
| `Select`       | Radix `Select.Root` — accessible dropdown.                                                                                                                                                                                                                                                                                    |
| `NativeSelect` | HTML `<select>` fallback for mobile.                                                                                                                                                                                                                                                                                          |
| `Checkbox`     | Radix checkbox.                                                                                                                                                                                                                                                                                                               |
| `Switch`       | Toggle switch.                                                                                                                                                                                                                                                                                                                |
| `Dialog`       | Radix dialog / modal.                                                                                                                                                                                                                                                                                                         |
| `Sheet`        | Slide-over drawer (Radix Dialog variant).                                                                                                                                                                                                                                                                                     |
| `Tabs`         | Radix tabs.                                                                                                                                                                                                                                                                                                                   |
| `Popover`      | Radix popover.                                                                                                                                                                                                                                                                                                                |
| `Calendar`     | Date picker calendar grid.                                                                                                                                                                                                                                                                                                    |
| `DatePicker`   | Input + calendar popover.                                                                                                                                                                                                                                                                                                     |
| `Separator`    | Horizontal / vertical divider.                                                                                                                                                                                                                                                                                                |
| `FormStatus`   | Async form status message (pending / success / error).                                                                                                                                                                                                                                                                        |
| `Icon`         | Hybrid Lucide + Lottie. Prefer mapped monochrome Lottie on hover (Heart, Store, Check, ArrowRight, Search, Star/Sparkles); else animate-ui path loop or CSS pulse. Pass `lottie={data}` to override or `lottie={false}` to force Lucide. Size tokens `xs`–`lg`. Explicit `animation` (e.g. `"fill"`) keeps animate-ui morphs. |
| `IconButton`   | Icon-only button (`size="icon"`, `variant="ghost"`, `shape="pill"`). Requires `aria-label`.                                                                                                                                                                                                                                   |

Usage:

```tsx
import { ArrowRight, Heart, Sparkles, Store } from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { Heading } from "@ceylonweddings/ui/components/heading";
import { Icon } from "@ceylonweddings/ui/components/icon";

<Icon icon={Heart} size="sm" />           {/* Lottie on hover */}
<Icon icon={Store} size="md" />           {/* Lottie */}
<Icon icon={Heart} lottie={false} />      {/* Lucide loop only */}
<Button icon={Heart}>Save</Button>
<Button iconRight={ArrowRight}>Continue</Button>
<Heading as="h2" icon={Sparkles}>Our story</Heading>
```

`icon` / `iconLeft` / `iconRight` are ignored when `asChild` is set (Slot allows one child). Nest `<Icon>` inside the child instead.

---

## Domain components (`packages/ui/src/domain/`)

Domain composites specific to Ceylon Weddings. Import path: `@ceylonweddings/ui/domain/[name]`.

### Chrome & layout

| Component         | File                   | Use                                                                                                                    |
| ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `AppShell`        | `app-shell.tsx`        | Left-rail shell for Pro + Admin. Logo, nav links, footer.                                                              |
| `AppHeader`       | `app-header.tsx`       | Top bar within AppShell (breadcrumbs, action slot).                                                                    |
| `DashboardLayout` | `dashboard-layout.tsx` | Couple planning layout: `DashboardStack`, `DashboardStats`, `DashboardPrimary`, `DashboardSecondary`, `DashboardMain`. |
| `AppFooter`       | `app-footer.tsx`       | Public site footer with nav links, locale/currency/theme controls.                                                     |
| `PageHeader`      | `page-header.tsx`      | Page-level heading with optional subtitle and actions slot.                                                            |
| `SectionCard`     | `section-card.tsx`     | Titled card section with optional trailing action.                                                                     |

### Planning hub

| Component      | File                | Use                                                                                                                      |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `CoupleHero`   | `couple-hero.tsx`   | Cinematic banner with couple names, event date, countdown, chips, and CTA. Used on hub (`density="hub"`) and guest site. |
| `StatCard`     | `stat-card.tsx`     | KPI card: icon, label, value, hint. Tones: default, info, warning, love.                                                 |
| `BudgetMeter`  | `budget-meter.tsx`  | Compact spend-vs-planned bar. Used on hub chip and budget sidebar totals.                                                |
| `TimelineRail` | `timeline-rail.tsx` | Horizontal scrolling day-of task/event rail.                                                                             |

### Wedding presentation (hub widgets)

All in `wedding-presentation.tsx`:

| Export             | Use                                                                       |
| ------------------ | ------------------------------------------------------------------------- |
| `PlanningProgress` | Completeness score ring.                                                  |
| `TeamGapBanner`    | Missing vendor category alert (e.g. "You haven't booked a photographer"). |
| `CeremonySchedule` | Per-event status chips and schedule summary.                              |
| `PlateSummaryCard` | Plate count / RSVP summary widget.                                        |

### Vendors

| Component            | File                       | Use                                                                    |
| -------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `VendorCard`         | `vendor-card.tsx`          | Catalog tile: triptych photos, name, city, category badge, price pill. |
| `VendorGallery`      | `vendor-gallery.tsx`       | Storefront gallery: featured image + stacked thumbs + intro video.     |
| `VendorIdentity`     | `vendor-identity.tsx`      | Avatar, name, city/district, verified/featured badges.                 |
| `VendorCompareDock`  | `vendor-compare-dock.tsx`  | Sticky compare tray (up to 3 vendors).                                 |
| `VendorCompareBoard` | `vendor-compare-board.tsx` | Side-by-side vendor comparison sheet.                                  |
| `VendorCompareTray`  | `vendor-compare-tray.tsx`  | Minimal compare tray export.                                           |
| `ShortlistControl`   | `shortlist-control.tsx`    | Heart / shortlist toggle button.                                       |
| `PackageCompare`     | `package-compare.tsx`      | Vendor package comparison cards.                                       |
| `TrustMarks`         | `trust-marks.tsx`          | Verified / featured / award badges row.                                |

### Team & suppliers

| Component       | File              | Use                                                                |
| --------------- | ----------------- | ------------------------------------------------------------------ |
| `TeamVendor`    | `team-vendor.tsx` | Booked/shortlisted vendor row in team page.                        |
| `SupplierStrip` | `team-vendor.tsx` | Horizontal photo strip of booked/shortlisted vendors (hub widget). |

### Guest & RSVP

| Component  | File            | Use                                      |
| ---------- | --------------- | ---------------------------------------- |
| `GuestRow` | `guest-row.tsx` | Guest household row in guest list table. |

### Media & creative tools

| Component              | File                         | Use                                                       |
| ---------------------- | ---------------------------- | --------------------------------------------------------- |
| `MediaFrame`           | `media-frame.tsx`            | Responsive image/video container with aspect ratio.       |
| `MediaStudio`          | `media-studio.tsx`           | Vendor photo/video gallery management studio (full CRUD). |
| `MoodboardStudio`      | `moodboard-studio.tsx`       | Moodboard canvas shell.                                   |
| `MoodboardStudioShell` | `moodboard-studio-shell.tsx` | Outer layout shell for moodboard page.                    |

### Vendor Pro tools

| Component        | File                  | Use                                                      |
| ---------------- | --------------------- | -------------------------------------------------------- |
| `OfferStudio`    | `offer-studio.tsx`    | Package + add-on editor (full CRUD with pricing modes).  |
| `MessagesStudio` | `messages-studio.tsx` | Support conversation UI (vendor/admin).                  |
| `CreatorForm`    | `creator-form.tsx`    | Generic create/edit form shell with async state.         |
| `AsyncList`      | `async-list.tsx`      | Catalog grid list: search, chips, pagination, skeletons. |
| `EmptyState`     | `empty-state.tsx`     | Empty / no-results illustration + message.               |

### Lists & tables (Kloqra server-table port)

| Component                                                 | File                           | Use                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DataTableList`                                           | `data-table-list.tsx`          | **Preferred** list shell: loading, empty / no-results, scroll, pagination. Pass server `page`/`limit`/`total` or use `useClientTablePagination`. |
| `DataTableHead` / `DataTableCell` / `TablePagination`     | `data-table.tsx`               | Table primitives + server pagination chrome.                                                                                                     |
| `DataTableSortableHead`                                   | `data-table-sortable-head.tsx` | Clickable sort header (asc → desc → clear).                                                                                                      |
| `AdminListToolbar`                                        | `admin-list-toolbar.tsx`       | Search + filters + actions; gate with `showListChrome`.                                                                                          |
| `SettingsList` / `SettingsListRow`                        | `settings-list-row.tsx`        | Settings/CMS row lists (pages, flags, awards).                                                                                                   |
| `SettingsSwitchRow`                                       | `settings-switch-row.tsx`      | Bordered label + switch for settings/taxonomy editors.                                                                                           |
| `PlanningList` / `PlanningListRow`                        | `planning-list-row.tsx`        | Planning checklist/budget/family/music/seating rows.                                                                                             |
| `PlanningFormPanel` / `PlanningEventToolbar` / `StatPill` | `planning-form-panel.tsx`      | Planning form clusters, event pickers, count chips.                                                                                              |
| `PreviewRow` / `PreviewRowList` / `BulletPreviewRow`      | `preview-row.tsx`              | Dashboard lead/message/step previews.                                                                                                            |
| `AdminQueueVendorCard`                                    | `admin-queue-vendor-card.tsx`  | Verify / Ceylon Picks queue cards.                                                                                                               |
| `AdminDataTable`                                          | `admin-data-table.tsx`         | **Deprecated** thin wrappers — migrate to `DataTableList`.                                                                                       |
| `Table`                                                   | `components/table.tsx`         | Base `<table>` primitives.                                                                                                                       |

Hooks: `useClientTablePagination` in `@ceylonweddings/ui/lib/use-client-table-pagination`; column helpers in `@ceylonweddings/ui/lib/data-table-columns`.

### Admin

| Component                  | File                             | Use                                                         |
| -------------------------- | -------------------------------- | ----------------------------------------------------------- |
| `AdminDetailSheet`         | `admin-detail-sheet.tsx`         | Slide-over detail panel for admin actions.                  |
| `AdminQueue`               | `admin-queue.tsx`                | Moderation queue row component.                             |
| `AdsStudio`                | `ads-studio.tsx`                 | Full promotion / ad campaign editor.                        |
| `AuditTimeline`            | `audit-timeline.tsx`             | Audit log entry timeline.                                   |
| `SubscriptionStatusBanner` | `subscription-status-banner.tsx` | Vendor subscription status alert (trial / grace / expired). |
| `WeddingPresentation`      | `wedding-presentation.tsx`       | Read-only wedding snapshot for admin support view.          |

### Motion

| Component                 | File         | Use                                                                          |
| ------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `Stagger` / `StaggerItem` | `motion.tsx` | Framer-Motion stagger-in animation wrapper. Used on hub stats, catalog grid. |

---

## Conventions

1. **Apps compose; packages define.** `apps/web` pages assemble domain components — they do not invent radius, color, or spacing values ad-hoc.
2. **Token-only styling.** Use semantic Tailwind utilities from the theme bridge. No palette classes, hex, arbitrary sizes, or weights above 500 — see [STYLEGUIDE.md](../packages/ui/STYLEGUIDE.md); `pnpm lint` enforces it.
3. **Domain components in `packages/ui/src/domain/`** — not in `apps/web/src/components/`. If a component is used in more than one page, it belongs in the package.
4. **App-only components** (page-specific layouts, route-specific wiring) live in `apps/web/src/components/`.
5. **Server components by default** in `apps/web`. Add `"use client"` only when the component requires hooks, event handlers, or browser APIs.

---

## Adding a new component

1. Create `packages/ui/src/domain/my-component.tsx`.
2. Export it from `packages/ui/src/domain/index.ts` (if one exists) or import directly with the full path.
3. Use existing token classes — no new CSS variables without a design review.
4. Document it in this file under the relevant section.

---

## Feedback patterns (ported from Kloqra)

| Need                                                | Use                                                                                                      | Not                               |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Yes / no question, destructive action               | `const confirm = useConfirm(); if (!(await confirm({ title, description, destructive: true }))) return;` | `window.confirm` (CI fails)       |
| Form or detail view in a modal                      | `AppModal` (`title`, `description`, `icon`, `tone`, `size`, `footer`)                                    | hand-rolled `Dialog` chrome       |
| Async mutation outcome (save, delete, send, export) | `toast.success()` / `toast.error()` from `@ceylonweddings/ui/components/toaster`                         | `alert()` (CI fails)              |
| Field validation                                    | `FormStatus` inline                                                                                      | toast                             |
| Section / page fetching                             | `CenteredLoader` or `Skeleton` / `SkeletonText` / `SkeletonCards`                                        | bare "Loading…" text              |
| Inline busy (button, chip)                          | `Spinner`                                                                                                | —                                 |
| List with nothing yet                               | `DataTableList` empty props + `showListChrome` to hide toolbar                                           | hand-rolled empty inside a table  |
| List filtered to nothing                            | `DataTableList` `filteredEmpty` + keep `AdminListToolbar`                                                | the "add your first…" empty state |
| Paginated admin/pro table                           | `DataTableList` + `useClientTablePagination` (or server page/limit/total)                                | raw `<table>` / `AdminDataTable`  |

`ConfirmProvider` and `Toaster` are mounted once by `AppProviders`. `useConfirm({ onConfirm })` runs async work with a locked "Please wait…" button (no double submit) and keeps Esc / backdrop / Cancel dismissal (Kloqra KLOQ-684).

List helpers: `getListEmptyMode`, `showListChrome`, `serverSourceCount` in `@ceylonweddings/ui/lib/list-state`.

---

## App shell, account menu, notifications (ported from Kloqra)

**Rail** — `AppShell` (`packages/ui/src/domain/app-shell.tsx`, look in `styles/components/nav.css`): sticky brand, scrolling nav, footer; an edge toggle that straddles the border; the collapsed logo doubles as "expand"; collapsed items get tooltips and section hairlines; active item = soft primary wash + inset ring; `AppShellNavItem badge={n}` shows a count (a dot on the icon when collapsed). Compact laptops start collapsed until the user picks a width (`sidebarCollapsedChosen`).

**Account menu** — `apps/web/src/components/account-menu.tsx`: identity card, Profile / Settings / Notification settings / Help centre, a Light · Dark · System switch, Log out.

**Notifications** — one pipeline:

1. Add a template to `packages/contracts/src/notifications/templates.ts` (title, body, email subject, CTA, variant, category, preference key — `null` = security notice, always on).
2. Producer: `notifications.notify({ userId, templateId, context })` (or `notifyVendor` / `notifyWedding` / `notifyAdmins`). It resolves the user's channels, writes the in-app row, pushes `notification.new` over Socket.IO and queues the branded email.
3. Add sample context to `SAMPLES` in `dev-email-preview.controller.ts` and check it at `GET /dev/emails` (API, dev only).

Web: `NotificationBell` (header: All / Unread tabs, day groups, mark all read), `/notifications` inbox (category chips, unread filter, load older) inside the role's dashboard shell, and Settings → Notifications (per-type In-app / Email switches).
