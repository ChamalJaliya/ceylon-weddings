# Product Modules

Two-sided platform: **free couple planning OS** + **paid vendor marketplace**, localized for Sri Lankan weddings.

---

## Sri Lanka design constraints

These realities shape every module decision. A module that ignores them will feel like a US app with a Sri Lankan skin.

| Reality | Product implication |
|---------|-------------------|
| Weddings are **multi-event**: poruwa, church, nikah, walima, homecoming, mehndi, engagement | `Event` objects, not one "wedding day" |
| **Ceremony type** drives vendor categories and checklist | Onboarding picks tradition(s); checklist is templated by type |
| **Nekath** (auspicious time) is the day-of clock | Timeline runs backward from nekath, not a fixed 4 pm template |
| **Parents and relatives** often plan and pay | `WeddingMember` roles: couple, mother/father, planner |
| Guest lists are **large and fluid** (200–500+) | Households, family sides, per-event RSVP, 10–15% buffer, phone/WhatsApp RSVP |
| **WhatsApp** is the real inbox | Deep-link inquiries, e-invites, reminders — not email-only |
| Cash in envelopes is the default gift | Gift tracking in `GuestHousehold`, not a Western registry |
| Legal marriage is **civil registration** (RGD notice + 14 days; 4-day residency for foreigners) | Legal checklist module |
| Diaspora + destination guests need hotels, travel, currency info | Multi-currency display, hotel blocks, bilingual site |
| Languages: English, Sinhala, Tamil | i18n from day one; UI ships EN + SI first |

**SL vendor categories not in The Knot:** Poruwa / ashtaka, astrologer, bridal dresser, Kandyan dancers / magul bera, nadaswaram & melam, jayamangala gatha, wedding cars, jewellery hire, marriage registrar, mehndi, halal caterer, thaali / jewellery.

**Budget context (2025):** Typical range LKR 0.8M–10M+, average ≈ LKR 2.5M. Venue + catering = 40–50%. Tool uses LKR plates, guest count, and city — not US percentages.

---

## Module status

### ✅ MVP (v1 — implemented)

| # | Module | Surface | What it does |
|---|--------|---------|-------------|
| 1 | **Wedding Profile & Onboarding** | Couple | Multi-tradition, multi-event wedding object. Names, date, city, types, guest count, budget, payer, diaspora flag, style. |
| 2 | **Planning Hub** | Couple | Countdown to next event, KPI stat cards (budget, RSVP, team, music, days left), schedule rail, supplier strip, team gap banner, inquiry list. |
| 3 | **Checklist & Timeline** | Couple | Task list with status (`TODO`/`DOING`/`DONE`), due dates, categories, assignees. Create/update/delete. |
| 4 | **Budget** | Couple | LKR budget lines with planned/spent/paid, multi-payer pots (couple/bride family/groom family), vendor link, deposit + balance due dates. Plate-rate math. |
| 5 | **Vendor Marketplace** | Couple + Vendor | Catalog with 19 SL categories, city/district/price filters, triptych photo cards. Storefront with gallery, packages, WhatsApp inquiry CTA. |
| 6 | **Vendor Listing (Pro)** | Vendor | Claim/create storefront: photos, packages, add-ons, pricing, media projects, service areas, WhatsApp, faqs. Leads inbox. |
| 7 | **Guest List (Households)** | Couple | Households with head name, side (bride/groom/both), plus count, RSVP status, meal preference, invite channel. Per-event invites. Bulk import. |
| 8 | **Wedding Website Lite** | Guest | Events, FAQ, travel notes, RSVP link. Password-optional. Custom slug (`/w/[slug]`). Bilingual (EN + SI). |
| 9 | **Family / Partner Access** | Couple | Invite members by email, set capability flags (`canEditGuests`, `canViewBudget`, `canManageVendors`). |

---

### 🔶 v1.5 (implemented in schema/API; UI in progress or partial)

| Module | Notes |
|--------|-------|
| **Calendar week view** | `Appointment` model + API fully implemented. Week-grid UI is in `/planning/calendar`. |
| **Seating chart** | Full API: `SeatingPlan` → `SeatingTable` → `SeatAssignment`. UI at `/planning/seating`. Canvas drag-and-drop is future. |
| **Reviews** | `Review` model + API + admin moderation. Public display on storefront is v1.5. |
| **Paid featured listings** | `FeaturedPlacement` + `Promotion` models. Admin UI for editorial/comped placements done. PayHere/Stripe checkout deferred. |
| **Legal/registration helper** | Route `/planning/legal` exists. Full content + wizard is v1.5. |
| **Nekath day-of run-of-show** | `POST /weddings/mine/events/:id/nekath-schedule` generates appointments. UI presentation is v1.5. |
| **WhatsApp e-invites** | `InviteTemplate` model + API implemented. WhatsApp-sending integration is v1.5. |
| **Tamil UI** | i18n catalog exists; copy lags — Tamil UI is v1.5. |

---

### 🔮 v2 (model may exist; feature is future)

| Module | Notes |
|--------|-------|
| **Inspiration / real weddings** | `Article` CMS implemented (admin UI + public list). Style quiz, mood boards, editorial magazine = v2. |
| **City cost benchmarks** | No data yet. |
| **Vendor calendar / booked-out dates** | Deferred. |
| **Best of Ceylon Weddings awards** | `AwardNomination` model + admin nomination UI exist. Public awards page = v2 campaign. |
| **Cash-gift tracker** | Gift received / thanked flags exist on `GuestHousehold`. Full tracker = v2. |
| **Destination wedding packages** | Destination flag on `Vendor`; full packages = v2. |
| **WhatsApp Business API** | `wa.me` deep-links in v1; WABA for automated reminders = v2. |
| **PayHere / Stripe** | Schema ready (`PaymentIntent`); checkout flow = v2. |
| **In-app messaging replacing WhatsApp** | `Conversation` + `Message` models exist for support. Full couple–vendor chat = v2. |
| **Mobile app** | `apps/mobile` Expo placeholder. Ships after web is stable. |

---

## Checklist templates by tradition

The task graph is localized, not just relabeled.

| Tradition | Extra checklist items |
|-----------|----------------------|
| Sinhala Buddhist (Kandyan) | Astrologer, nekath appointment, poruwa ashtaka, Kandyan dancers, magul bera, jayamangala gatha, homecoming |
| Hindu | Priest, thaali, mehndi, fire ritual logistics, nadaswaram / melam |
| Muslim | Maulvi, mahr note, walima, halal catering |
| Christian | Church booking, banns, choir |
| Shared | Venue, photo/video, bridal dresser, makeup, cake, cars, invitations, registrar |

---

## Vendor category taxonomy

19 categories localized for Sri Lanka:

| Category | SL equivalents |
|----------|---------------|
| `VENUE` | Hotels, banquet halls, garden venues |
| `PHOTO_VIDEO` | Photographers, videographers |
| `BRIDAL_WEAR` | Bridal sarees, gowns, rental |
| `GROOM_WEAR` | Suits, national dress |
| `JEWELLERY` | Jewellery, hire sets |
| `HAIR_MAKEUP` | Hair, makeup, beauty |
| `BRIDAL_DRESSER` | Kandyan or Hindu bridal dresser |
| `FLORIST_DECOR` | Florists, decorators, table styling |
| `CATERER` | Catering (halal / vegetarian flags) |
| `CAKE` | Wedding cakes |
| `ENTERTAINMENT` | DJ, bands, Kandyan dancers, nadaswaram |
| `PORUWA` | Poruwa / ashtaka ceremony services |
| `ASTROLOGY` | Astrologer / nekath |
| `WEDDING_CARS` | Bridal cars, vintage cars |
| `INVITATIONS` | Stationery, printing |
| `PLANNER` | Wedding planner, day coordinator |
| `REGISTRAR` | Marriage registrar, officiants |
| `MEHNDI` | Mehndi / henna |
| `TRANSPORT` / `ACCOMMODATION` | Guest transport, hotel blocks |

---

## Build order (reference)

### MVP
1. Wedding profile (multi-tradition, multi-event)
2. Planning hub + localized checklist
3. Budget (LKR, multi-payer)
4. Vendor marketplace browse + storefront + WhatsApp inquiry
5. Vendor signup + basic listing
6. Guest list (households, events, sides)
7. Wedding website lite (events, FAQ, travel, RSVP link)
8. Family/partner invite
9. English + Sinhala UI strings

### v1.5
- WhatsApp e-invites + phone-RSVP logging
- Seating
- Reviews
- Paid featured listings
- Registration/legal helper
- Nekath day-of timeline

### v2
- Tamil, inspiration/real weddings, city cost benchmarks, vendor calendar, awards, cash-gift tracker, destination packages

---

## Competitive landscape

| Platform | Strength | Gap vs Ceylon Weddings |
|----------|----------|----------------------|
| The Knot | Unmatched planning+marketplace loop | Zero SL culture, vendors, or WhatsApp |
| planawedding.lk | Strong couple tools (seating, e-invites) | Marketplace still nascent |
| planmywedding.lk | Marketplace + human coordination | Less self-serve couple OS |
| nevesta.lk / ceylonweddings.com | Directories | Not a planning OS |

**Winning combination:** culture-aware checklist + WhatsApp-native vendor leads + multi-event guest list + bilingual website for overseas family.
