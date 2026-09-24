# Platform foundation

Status: accepted
Owner: platform

## Goal

Provide a contract-first monorepo so the public site and a later mobile app share one API, one Zod contract, and one UI kit.

## Apps

- `apps/api` NestJS API, Swagger at `/docs` (port 4000)
- `apps/web` public Next.js site (port 3000): marketplace, couple planning, vendor pro, admin, guest pages
- `apps/mobile` deferred Expo placeholder

Couple, vendor, and admin are **roles on the same site**, not separate Next apps.

## Non-negotiables

- Zod schemas in `packages/contracts` are the source of truth
- Nest DTOs wrap those schemas; Swagger is generated from them
- Auth uses httpOnly cookies (`cw_access`, `cw_refresh`)
- Locales: `en`, `si`, `ta` via `cw_locale`
- Currencies: LKR base, display USD/AUD/GBP/EUR via `cw_currency`
- Themes: pearl, temple, night via `cw_theme` + next-themes
- Redis: cache, BullMQ, Socket.IO adapter
