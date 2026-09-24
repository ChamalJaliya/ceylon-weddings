# Data Model

PostgreSQL via Prisma. Zod contracts in `packages/contracts` mirror these types. All money is stored as **integer LKR**; display conversion happens in the client.

---

## Entity relationship overview

```
User ──< Session
User ──< WeddingMember >── Wedding
User ── Vendor (optional claim)

Wedding ──< WeddingMember
Wedding ──< Event
Wedding ──< Task
Wedding ──< BudgetLine ──> Vendor?
Wedding ──< GuestHousehold ──< EventInvite >── Event
Wedding ──< GuestHousehold ──< SeatAssignment >── SeatingTable
Wedding ──< Inquiry >── Vendor
Wedding ──< WeddingVendor >── Vendor
Wedding ──< Appointment
Wedding ──< InviteTemplate
Wedding ──< SeatingPlan ──< SeatingTable ──< SeatAssignment
Wedding ──< MusicPlan ──< MusicTrack
Wedding ──< MusicPlan ──< MusicCue ──> Appointment?
Wedding ──< Moodboard
Wedding ──< FamilyPerson (tree)
Wedding ──< Conversation ──< ConversationParticipant, Message

Vendor ──< VendorPackage ──< VendorAddOn (m:m)
Vendor ──< VendorMediaProject ──< VendorMediaItem
Vendor ──< VendorVideo
Vendor ──< Review
Vendor ──< FeaturedPlacement
Vendor ──< Promotion
Vendor ──< AwardNomination
Vendor ── VendorSubscription

Article ──< AnalyticsEvent
AuditLog (actor: User)
Report (reporter: User, resolver: User)
Notification (recipient: User)
PaymentIntent
```

---

## Enums

### User & auth

| Enum | Values |
|------|--------|
| `Role` | `COUPLE`, `VENDOR`, `ADMIN`, `FAMILY` |
| `UserStatus` | `ACTIVE`, `SUSPENDED` |
| `AdminCapability` | `MANAGE_VENDORS`, `MANAGE_USERS`, `MANAGE_CONTENT`, `MANAGE_REPORTS`, `MANAGE_FEATURED`, `VIEW_AUDIT`, `IMPERSONATE`, `MANAGE_SETTINGS` |

### Wedding & events

| Enum | Values |
|------|--------|
| `WeddingType` | `KANDYAN_PORUWA`, `WESTERN_CHURCH`, `HINDU`, `MUSLIM_NIKAH`, `HOMECOMING`, `ENGAGEMENT`, `MEHNDI`, `DESTINATION` |
| `WeddingStyle` | `MINIMALIST`, `TRADITIONAL`, `KANDYAN`, `MODERN`, `BEACH` |
| `EventKind` | `PORUWA`, `CHURCH`, `NIKAH`, `WALIMA`, `RECEPTION`, `HOMECOMING`, `MEHNDI`, `ENGAGEMENT`, `OTHER` |
| `Payer` | `COUPLE`, `BRIDE_FAMILY`, `GROOM_FAMILY` |

### Guests

| Enum | Values |
|------|--------|
| `GuestSide` | `BRIDE`, `GROOM`, `BOTH` |
| `RsvpStatus` | `CONSIDERING`, `INVITED`, `CONFIRMED`, `DECLINED`, `MAYBE`, `WALK_IN` |
| `Meal` | `VEG`, `FISH`, `CHICKEN`, `BEEF`, `HALAL`, `OTHER` |
| `InviteChannel` | `WHATSAPP`, `PHONE`, `PRINTED`, `OVERSEAS` |
| `FamilyRelation` | `MOTHER`, `FATHER`, `SIBLING`, `AUNT_UNCLE`, `COUSIN`, `GRANDPARENT`, `FRIEND`, `OTHER` |

### Tasks & budget

| Enum | Values |
|------|--------|
| `TaskStatus` | `TODO`, `DOING`, `DONE` |

### Vendors

| Enum | Values |
|------|--------|
| `VendorCategory` | `VENUE`, `PHOTO_VIDEO`, `BRIDAL_WEAR`, `GROOM_WEAR`, `JEWELLERY`, `HAIR_MAKEUP`, `BRIDAL_DRESSER`, `FLORIST_DECOR`, `CATERER`, `CAKE`, `ENTERTAINMENT`, `PORUWA`, `ASTROLOGY`, `WEDDING_CARS`, `INVITATIONS`, `PLANNER`, `REGISTRAR`, `MEHNDI`, `TRANSPORT`, `ACCOMMODATION` |
| `VendorLinkStatus` | `SHORTLISTED`, `INQUIRED`, `BOOKED` |
| `InquiryStatus` | `NEW`, `REPLIED`, `CLOSED` |
| `VendorModerationStatus` | `PENDING`, `APPROVED`, `REJECTED`, `HIDDEN` |
| `PriceDisplayMode` | `FIXED`, `FROM`, `ON_REQUEST` |
| `PackageTier` | `BASIC`, `ADVANCED`, `DREAM` |
| `PackagePricingMode` | `FIXED`, `FROM`, `RANGE`, `PER_GUEST`, `ON_REQUEST` |
| `PackageStatus` | `DRAFT`, `PUBLISHED` |
| `PackageBadge` | `POPULAR`, `BEST_VALUE`, `LIMITED` |
| `PackageEventType` | `WEDDING`, `HOMECOMING`, `ENGAGEMENT`, `PRESHOOT`, `PORUWA`, `DESTINATION`, `REGISTRATION` |

### Appointments & music

| Enum | Values |
|------|--------|
| `AppointmentKind` | `VENDOR_MEETING`, `TASTING`, `FITTING`, `CEREMONY`, `DAY_OF`, `OTHER` |
| `MusicListKind` | `MUST`, `MAYBE`, `DO_NOT` |
| `MusicCueKind` | `PROCESSIONAL`, `ENTRANCE`, `CEREMONY`, `RECESSIONAL`, `COCKTAIL`, `FIRST_DANCE`, `PARENT_DANCE`, `CAKE`, `BOUQUET`, `PARTY`, `LAST_DANCE`, `TRADITIONAL`, `CUSTOM` |
| `MusicLanguage` | `SINHALA`, `TAMIL`, `ENGLISH`, `HINDI`, `MIXED`, `OTHER` |
| `MusicVibe` | `TRADITIONAL`, `ROMANTIC`, `UPBEAT`, `BAILA`, `RELIGIOUS`, `SOFT`, `PARTY`, `CUSTOM` |

### Content, ads & admin

| Enum | Values |
|------|--------|
| `ArticleCategory` | `FLOWERS`, `CEREMONY`, `CAKES`, `TRANSPORT`, `FASHION`, `BEAUTY`, `FAMILY`, `EVENTS`, `TRAVEL`, `FOOD`, `REAL_WEDDING` |
| `ArticleStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `SubscriptionStatus` | `TRIAL`, `ACTIVE`, `GRACE`, `EXPIRED`, `CANCELLED`, `COMPED` |
| `BillingInterval` | `MONTHLY`, `ANNUAL` |
| `ReportEntityType` | `VENDOR`, `INQUIRY`, `REVIEW`, `ARTICLE`, `USER` |
| `ReportStatus` | `OPEN`, `RESOLVED`, `DISMISSED` |
| `FeaturedPlacementSource` | `EDITORIAL`, `COMPED`, `PAID_PENDING`, `PAID` |
| `PromotionStatus` | `DRAFT`, `SCHEDULED`, `ACTIVE`, `PAUSED`, `ARCHIVED` |
| `PromotionLayout` | `SPOTLIGHT`, `BANNER`, `CARD`, `STRIP`, `PICKS_TILE` |
| `PromotionSlot` | `HOME_HERO`, `HOME_PICKS`, `CATALOG_TOP`, `CATALOG_INLINE`, `IDEAS_RAIL`, `VENDOR_SIDEBAR` |
| `AwardNominationStatus` | `NOMINATED`, `SHORTLISTED`, `WINNER`, `REJECTED` |
| `AnalyticsEventKind` | `VENDOR_PROFILE_VIEW`, `WHATSAPP_TAP`, `INQUIRY_CREATED`, `ARTICLE_VIEW`, `PROMO_IMPRESSION`, `PROMO_CLICK` |

---

## Core entities

### `User`

| Field | Type | Notes |
|-------|------|-------|
| `id` | cuid | |
| `email` | String unique | |
| `phone` | String? | |
| `passwordHash` | String | bcrypt |
| `name` | String | |
| `role` | `Role` | default `COUPLE` |
| `status` | `UserStatus` | default `ACTIVE`; `SUSPENDED` blocks login |
| `locale` | String | default `en` |
| `currency` | String | default `LKR` |
| `capabilities` | `AdminCapability[]` | fine-grained admin perms |
| `totpSecret` / `totpEnabled` | | TOTP fields (UI deferred) |

Relations: `sessions`, `memberships`, `assignedTasks`, `vendor?`, `auditLogs`, `reportsFiled`, `reportsResolved`, `articlesAuthored`, `conversationParts`, `messagesSent`, `notifications`, `assignedAdminThreads`.

---

### `Session`

| Field | Type | Notes |
|-------|------|-------|
| `id` | cuid | |
| `userId` | FK → `User` | cascade delete |
| `refreshTokenHash` | String | bcrypt of `cw_refresh` |
| `expiresAt` | DateTime | 30 days |

---

### `Wedding`

The central planning record. All couple-facing data belongs to one `Wedding`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | cuid | |
| `slug` | String unique | used in guest URL `/w/{slug}` |
| `partnerOneName` | String | |
| `partnerTwoName` | String | |
| `date` | DateTime? | nullable = "date TBD" |
| `city` / `district` | String? | SL geography |
| `guestCountEstimate` | Int | default 150 |
| `budgetLkr` | Int | default 2 500 000 |
| `payer` | `Payer` | default `COUPLE` |
| `types` | `WeddingType[]` | multi-tradition |
| `locale` | String | default `en` |
| `currency` | String | default `LKR` |
| `planningFromOverseas` | Boolean | diaspora flag |
| `websiteEnabled` | Boolean | guest site toggle |
| `websiteFaq` / `travelNotes` | String? | guest site content |
| `style` | `WeddingStyle` | visual style palette |
| `colors` | String[] | hex palette derived from style |

Relations: `members`, `events`, `tasks`, `budgetLines`, `households`, `inquiries`, `vendors`, `appointments`, `reviews`, `inviteTemplates`, `seatingPlans`, `familyPeople`, `conversations`, `musicPlans`, `moodboards`.

---

### `WeddingMember`

Join table granting a `User` access to a `Wedding` with capability flags.

| Field | Type | Notes |
|-------|------|-------|
| `weddingId` / `userId` | FK | unique pair |
| `role` | `Role` | `COUPLE`, `FAMILY` |
| `canEditGuests` | Boolean | default true |
| `canViewBudget` | Boolean | default true |
| `canManageVendors` | Boolean | default false |

---

### `Event`

One ceremony or event within a wedding. A wedding has many events.

| Field | Type | Notes |
|-------|------|-------|
| `weddingId` | FK | |
| `kind` | `EventKind` | Poruwa, Church, Nikah, etc. |
| `name` | String | display name |
| `startsAt` | DateTime? | ceremony start |
| `nekathAt` | DateTime? | auspicious time (if Kandyan) |
| `venueName` / `address` | String? | |

Relations: `invites`, `appointments`, `seatingPlan?`, `musicPlan?`, `moodboards`.

---

### `Task`

Checklist item. Assignable to any `User` on the wedding.

| Field | Type | Notes |
|-------|------|-------|
| `weddingId` | FK | |
| `title` | String | |
| `dueAt` | DateTime? | |
| `status` | `TaskStatus` | `TODO` → `DOING` → `DONE` |
| `category` | String? | free-text category tag |
| `assigneeUserId` | FK → `User`? | |

---

### `BudgetLine`

One line in the wedding budget. Money stored as integer LKR.

| Field | Type | Notes |
|-------|------|-------|
| `weddingId` | FK | |
| `category` | String | e.g. `venue+catering` |
| `label` | String | display name |
| `plannedLkr` | Int | budget allocation |
| `spentLkr` | Int | actual spend to date |
| `paidLkr` | Int | amount already paid |
| `payer` | `Payer` | which family pot |
| `vendorId` | FK → `Vendor`? | linked vendor |
| `depositDueAt` / `balanceDueAt` | DateTime? | payment milestones |

---

### `GuestHousehold`

A household unit (e.g. "Mr & Mrs Perera + 2 children"). Sri Lankan weddings have large, fluid guest lists.

| Field | Type | Notes |
|-------|------|-------|
| `weddingId` | FK | |
| `label` | String | household display name |
| `headName` | String | primary contact |
| `side` | `GuestSide` | Bride / Groom / Both |
| `plusCount` | Int | additional members |
| `status` | `RsvpStatus` | overall RSVP status |
| `meal` | `Meal`? | dietary preference |
| `channel` | `InviteChannel` | how to reach them |
| `phone` / `email` | String? | |
| `giftReceived` / `thanked` | Boolean | private gift tracking |

Relations: `invites` (per-event), `seatAssignments`, `familyPeople`.

---

### `EventInvite`

Which `GuestHousehold` is invited to which `Event`. Many-to-many with its own RSVP status.

| Field | Type |
|-------|------|
| `householdId` | PK + FK |
| `eventId` | PK + FK |
| `status` | `RsvpStatus` |

---

### `FamilyPerson`

Named family member, optionally linked to a household. Supports a **family tree** (`parentId` self-reference).

| Field | Type |
|-------|------|
| `weddingId` | FK |
| `name` | String |
| `side` | `GuestSide` |
| `relation` | `FamilyRelation` |
| `phone` | String? |
| `householdId` | FK → `GuestHousehold`? |
| `parentId` | FK → `FamilyPerson`? |

---

### `Vendor`

Marketplace listing. Claimed by a `User` (optional — admin can create unclaimed listings).

| Key fields | Notes |
|-----------|-------|
| `slug` | URL-safe unique identifier |
| `category` | `VendorCategory` |
| `city` / `district` | SL geography |
| `startingPriceLkr` / `priceDisplayMode` | Pricing display |
| `whatsapp` | `wa.me` link for inquiry CTA |
| `photoUrl` / `photos[]` | Gallery |
| `verified` / `featured` | Trust signals |
| `moderationStatus` | `PENDING` → `APPROVED` / `REJECTED` / `HIDDEN` |
| `styles[]` / `destinationExperienced` | Filtering attributes |

Relations: `inquiries`, `weddingLinks`, `budgetLines`, `packages`, `addOns`, `mediaProjects`, `videos`, `reviews`, `appointments`, `featuredPlacements`, `promotions`, `awardNominations`, `subscription`, `conversations`.

---

### `VendorPackage` / `VendorAddOn`

Structured pricing tiers with inclusions/exclusions. AddOns can be attached to multiple packages.

---

### `VendorMediaProject` / `VendorMediaItem`

Photo galleries: a project groups multiple images with a cover, title, and event date. Items are ordered by `sortOrder`.

---

### `Inquiry`

Couple → vendor inquiry. Contains a prefilled WhatsApp URL.

| Field | Type |
|-------|------|
| `weddingId` + `vendorId` | FKs |
| `message` | String |
| `status` | `InquiryStatus` |
| `whatsappUrl` | String? |
| `preferredDate` | DateTime? |

---

### `WeddingVendor`

The couple's shortlist / booked team. Join between `Wedding` and `Vendor` with a status.

| Field | Type |
|-------|------|
| `weddingId` + `vendorId` | unique pair |
| `status` | `VendorLinkStatus` (`SHORTLISTED`, `INQUIRED`, `BOOKED`) |

---

### `Appointment`

Scheduled meetings, tastings, fittings, or ceremony slots. Can be linked to an `Event` and/or a `Vendor`.

| Key fields | Notes |
|-----------|-------|
| `kind` | `AppointmentKind` |
| `startsAt` / `endsAt` | DateTime |
| `venueName` / `address` | optional |
| `reminderMinutes` | default 30 |
| `color` | calendar color |
| `ownerLabel` | display label override |

---

### `SeatingPlan` / `SeatingTable` / `SeatAssignment`

Per-event seating. One plan per event. Tables have capacity; seat assignments link households to tables.

---

### `MusicPlan` / `MusicTrack` / `MusicCue`

Per-event music briefing. Tracks are songs (with list kind: `MUST`/`MAYBE`/`DO_NOT`). Cues are ceremony moments (e.g. `PROCESSIONAL`, `FIRST_DANCE`) with timing and linked tracks. Plans can be shared with a vendor via a public token.

---

### `Moodboard`

Visual mood/inspiration board per event. Stores a JSON scene (canvas state) and images via presigned S3 URLs. Shareable via token.

---

### `InviteTemplate`

WhatsApp/phone invite message templates per language. Wedding has starter templates generated on creation.

---

### `Review`

Vendor review with multi-criteria rating (quality, professionalism, flexibility, response time, value, communication). Admin can hide reviews.

---

### `Article`

Editorial content (Ideas section). Status: `DRAFT` → `PUBLISHED` → `ARCHIVED`. Optionally featured. Linked to `AnalyticsEvent` for article views.

---

### `VendorSubscription`

Vendor billing lifecycle. Status: `TRIAL` → `ACTIVE` → `GRACE` → `EXPIRED`/`CANCELLED`. Supports monthly or annual billing. `PaymentIntent` table ready for gateway integration.

---

### `FeaturedPlacement`

Admin-controlled featured slot schedule for vendors. Source: `EDITORIAL` (free), `COMPED`, `PAID_PENDING`, `PAID`.

---

### `Promotion` / `PromotionSlot`

Paid ad campaigns. Placements: `HOME_HERO`, `HOME_PICKS`, `CATALOG_TOP`, `CATALOG_INLINE`, `IDEAS_RAIL`, `VENDOR_SIDEBAR`. Layouts: `SPOTLIGHT`, `BANNER`, `CARD`, `STRIP`, `PICKS_TILE`.

---

### `AuditLog`

Every mutating admin action is recorded here. Fields: `actor`, `action`, `entityType`, `entityId`, `diff` (JSON), `ip`, `userAgent`.

---

### `Report`

Abuse/takedown reports filed against `VENDOR`, `INQUIRY`, `REVIEW`, `ARTICLE`, or `USER`. Resolved by an admin.

---

### `Conversation` / `Message` / `Notification`

Support inbox for vendor–couple conversations. Admins can be assigned to conversations. Notifications are delivered in-app; push/WhatsApp are future integrations.

---

## Money rules

- All monetary values stored as **integer LKR** (no floats, no decimals).
- `formatMoney(lkr: number, currency: string)` in `packages/web/src/lib/` handles display conversion.
- Overseas contributors can log budget amounts in foreign currency with a locked or live rate; stored as converted LKR.
- Plate-rate math: `budgetLkr / guestCountEstimate` gives per-head cost.

---

## Apply migrations

```bash
pnpm db:generate   # Regenerate Prisma client after schema changes
pnpm db:migrate    # Create migration and apply (dev)
pnpm db:seed       # Seed test data
```
