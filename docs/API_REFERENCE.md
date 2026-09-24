# API Reference

NestJS API at `:4000`. Swagger UI at `http://localhost:4000/docs`.

All authenticated endpoints require the `cw_access` httpOnly cookie sent with `credentials: "include"`. The typed client in `packages/web/src/api/` wraps every endpoint.

---

## Auth — `POST /auth/*`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | ❌ | Create account (COUPLE or VENDOR role). Sets `cw_access` + `cw_refresh` cookies. |
| `POST` | `/auth/login` | ❌ | Authenticate. Sets auth cookies. |
| `POST` | `/auth/logout` | ✅ | Deletes refresh session row; clears cookies. |
| `GET` | `/auth/me` | ✅ | Returns `User` shape with active vendor flag. |

---

## Wedding — `GET|PATCH /weddings/mine`

All couple/family endpoints require a valid session; the API resolves the caller's `Wedding` automatically.

### Wedding record

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine` | Full hub payload: wedding + events + tasks + budget + team + guests summary + hubStats |
| `PATCH` | `/weddings/mine` | Update wedding fields (names, date, city, types, style, colors, website copy, …) |

### Tasks

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/weddings/mine/tasks` | Create task |
| `PATCH` | `/weddings/mine/tasks/:id` | Update title, status, dueAt, category, assignee |
| `DELETE` | `/weddings/mine/tasks/:id` | Delete task |

### Budget

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/budget` | All budget lines with summary totals |
| `POST` | `/weddings/mine/budget` | Create budget line |
| `PATCH` | `/weddings/mine/budget/:id` | Update planned/spent/paid, payer, vendor link |
| `DELETE` | `/weddings/mine/budget/:id` | Delete line |

### Events

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/weddings/mine/events` | Create event (kind, name, startsAt, nekathAt, venue) |
| `PATCH` | `/weddings/mine/events/:id` | Update event |
| `DELETE` | `/weddings/mine/events/:id` | Delete event |

### Appointments / Calendar

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/appointments` | All appointments for this wedding |
| `POST` | `/weddings/mine/appointments` | Create appointment |
| `PATCH` | `/weddings/mine/appointments/:id` | Update |
| `DELETE` | `/weddings/mine/appointments/:id` | Delete |
| `POST` | `/weddings/mine/events/:id/nekath-schedule` | Auto-generate nekath-based appointments for a ceremony event |

### Guests

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/guests` | Paginated guest household list (`?side=`, `?status=`, `?q=`) |
| `POST` | `/weddings/mine/guests` | Create household |
| `POST` | `/weddings/mine/guests/bulk` | Bulk-create households (CSV import) |
| `PATCH` | `/weddings/mine/guests/:id` | Update household |
| `DELETE` | `/weddings/mine/guests/:id` | Delete household |
| `PATCH` | `/weddings/mine/guests/:id/invites/:eventId` | Update per-event RSVP status |

### Family tree

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/family` | Family tree for this wedding |
| `POST` | `/weddings/mine/family` | Add family person |
| `PATCH` | `/weddings/mine/family/:id` | Update |
| `DELETE` | `/weddings/mine/family/:id` | Delete |

### Members (collaboration)

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/weddings/mine/members` | Invite family member / partner / planner by email |
| `PATCH` | `/weddings/mine/members/:id` | Update capability flags (`canEditGuests`, `canViewBudget`, `canManageVendors`) |
| `DELETE` | `/weddings/mine/members/:id` | Remove member |

### Inquiries & team

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/inquiries` | Inquiries sent by this couple |
| `POST` | `/weddings/mine/inquiries` | Send inquiry (creates WhatsApp URL) |
| `POST` | `/weddings/mine/team` | Shortlist a vendor |
| `PATCH` | `/weddings/mine/team/:vendorId` | Update team status (`SHORTLISTED` → `INQUIRED` → `BOOKED`) |
| `DELETE` | `/weddings/mine/team/:vendorId` | Remove from team |

### Invite templates

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/invite-templates` | List WhatsApp/invite message templates |
| `POST` | `/weddings/mine/invite-templates` | Create template |
| `POST` | `/weddings/mine/invite-templates/reset` | Reset to starter templates |
| `PATCH` | `/weddings/mine/invite-templates/:id` | Update template |
| `DELETE` | `/weddings/mine/invite-templates/:id` | Delete template |

### Seating

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/events/:eventId/seating` | Get seating plan for an event |
| `PUT` | `/weddings/mine/events/:eventId/seating` | Upsert full seating plan (tables + assignments) |

### Music plans

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/music` | All music plans |
| `POST` | `/weddings/mine/music` | Upsert music plan for an event |
| `GET` | `/weddings/mine/music/:planId` | Single plan with tracks + cues |
| `PATCH` | `/weddings/mine/music/:planId` | Update plan metadata |
| `POST` | `/weddings/mine/music/:planId/tracks` | Add track |
| `PATCH` | `/weddings/mine/music/:planId/tracks/:trackId` | Update track |
| `DELETE` | `/weddings/mine/music/:planId/tracks/:trackId` | Delete track |
| `POST` | `/weddings/mine/music/:planId/tracks/reorder` | Reorder tracks |
| `POST` | `/weddings/mine/music/:planId/cues` | Add cue |
| `PATCH` | `/weddings/mine/music/:planId/cues/:cueId` | Update cue |
| `DELETE` | `/weddings/mine/music/:planId/cues/:cueId` | Delete cue |
| `POST` | `/weddings/mine/music/:planId/cues/reorder` | Reorder cues |
| `POST` | `/weddings/mine/music/:planId/cues/seed-templates` | Seed cues from tradition templates |
| `POST` | `/weddings/mine/music/:planId/share` | Set share token (share brief with vendor) |

### Moodboards

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/weddings/mine/moodboards` | List moodboards |
| `POST` | `/weddings/mine/moodboards` | Create board |
| `GET` | `/weddings/mine/moodboards/:boardId` | Get board with scene |
| `PATCH` | `/weddings/mine/moodboards/:boardId` | Update metadata |
| `PUT` | `/weddings/mine/moodboards/:boardId/scene` | Save canvas scene JSON |
| `DELETE` | `/weddings/mine/moodboards/:boardId` | Delete board |
| `POST` | `/weddings/mine/moodboards/:boardId/presign` | Get presigned S3 URL for image upload |
| `PATCH` | `/weddings/mine/moodboards/:boardId/share` | Set share token |

---

## Vendors — `/vendors`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/vendors` | ❌ | Paginated catalog. Filters: `category`, `city`, `district`, `priceMin`, `priceMax`, `q` (search), `verified`, `featured`. |
| `GET` | `/vendors/:slug` | ❌ | Storefront detail with packages, media projects, reviews |
| `GET` | `/vendors/me` | ✅ (VENDOR) | Own listing |
| `PATCH` | `/vendors/me` | ✅ (VENDOR) | Update own listing |
| `POST` | `/vendors/me/media/presign` | ✅ (VENDOR) | Get presigned S3 URL for photo upload |
| `GET` | `/vendors/me/leads` | ✅ (VENDOR) | Inquiry inbox |
| `POST` | `/vendors/:id/reviews` | ✅ | Submit review for a vendor |

---

## Public endpoints — `/public/*`

No authentication required.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/public/weddings/:slug` | Guest-facing wedding website data |
| `POST` | `/public/weddings/:slug/rsvp` | Guest submits RSVP |
| `GET` | `/public/music-brief/:token` | Vendor views shared music brief |
| `GET` | `/public/moodboards/:token` | Vendor views shared moodboard |

---

## Articles — `/articles`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/articles` | ❌ | List articles (`?category=`, `?q=`, `?vendorSlug=`) |
| `GET` | `/articles/:slug` | ❌ | Single article |

---

## Admin — `/admin/*`

All admin endpoints require `role === ADMIN`. Fine-grained operations also check `AdminCapability`.

See [`specs/002-admin.md`](../specs/002-admin.md) for full admin surface documentation.

| Area | Prefix | Capabilities |
|------|--------|-------------|
| Stats + KPIs | `/admin/stats` | — |
| Vendors | `/admin/vendors` | `MANAGE_VENDORS` |
| Vendor moderation queues | `/admin/queues/verify`, `/admin/queues/picks`, `/admin/queues/reports` | |
| Users | `/admin/users` | `MANAGE_USERS` |
| Weddings (read-only) | `/admin/weddings` | — |
| Inquiries | `/admin/inquiries` | `MANAGE_VENDORS` |
| Content (CMS) | `/admin/articles` | `MANAGE_CONTENT` |
| Reviews | `/admin/reviews` | `MANAGE_REPORTS` |
| Featured placements | `/admin/featured` | `MANAGE_FEATURED` |
| Promotions / Ads | `/admin/promotions` | `MANAGE_FEATURED` |
| Award nominations | `/admin/awards` | `MANAGE_SETTINGS` |
| Audit log | `/admin/audit` | `VIEW_AUDIT` |
| Feature flags | `/admin/settings` | `MANAGE_SETTINGS` |

---

## Search — `/search`

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/search` | Full-text vendor + article search |

---

## Health

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/health` | Liveness probe (DB + Redis) |

---

## Realtime — Socket.IO

- Path: `/realtime`
- Redis adapter for multi-instance scaling.
- Events: notification push (v1 log-only; delivery wired in v1.5).

---

## Error responses

All errors follow NestJS conventions:

```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation failure (Zod) |
| 401 | No valid session / expired token |
| 403 | Insufficient role or capability |
| 404 | Resource not found |
| 409 | Conflict (duplicate slug, duplicate email) |
| 500 | Internal server error |
