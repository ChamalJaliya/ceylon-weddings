# Ceylon Weddings — mobile (Expo)

iOS + Android app for **couples (and family members)** and **wedding guests**.
Vendor Pro and Admin stay on the website.

## What's in it

| Who                         | Screens                                                                                                                                                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Couple / family (signed in) | Home (countdown, KPIs, events with nekath, up-next tasks, still-to-book) · Checklist (tick off, add) · Budget (LKR, by category) · Guests (search, side filter, WhatsApp) · Vendors (search, categories) → Storefront (packages, reviews, shortlist, WhatsApp inquiry) |
| Guest (no login)            | Open invitation by link or code → wedding page (events, nekath, maps, travel, FAQ) → RSVP per event with plus-ones and meal                                                                                                                                            |

Deep links: `ceylonweddings://w/<slug>` opens a guest invitation directly.

Uses the existing Nest API unchanged — httpOnly `cw_access`/`cw_refresh` cookies are kept by the
native cookie store (`credentials: "include"`), with one refresh-and-retry on 401 like the web client.
Types come from `@ceylonweddings/contracts` (type-only imports). Colours mirror `packages/ui` tokens (pearl / night).

## Run it

```bash
pnpm install                         # from repo root
cd apps/mobile
npx expo install --fix               # align native deps with the installed Expo SDK
cp .env.example .env                 # set EXPO_PUBLIC_API_URL (see comments)
pnpm dev                             # then press i (iOS) / a (Android), or scan with Expo Go
```

Sign in with `couple@ceylonweddings.com` / `Password123!`, or tap **I'm a guest** and enter `nimali-and-kasun`.

On a physical phone over plain http, the API must run with `COOKIE_SECURE=false` and the URL must be your Mac's LAN IP.

## Next up

- Registration + Google sign-in in-app
- Push notifications (RSVP received, vendor replies) via expo-notifications + BullMQ
- Edit budget lines / guests, calendar & agenda tabs
- Sinhala / Tamil via `@ceylonweddings/i18n`
- Universal links for `https://ceylonweddings.com/w/<slug>`
