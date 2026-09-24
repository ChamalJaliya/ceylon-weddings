# Auth cookies

Status: accepted
Owner: platform

## Contract

`packages/contracts/src/auth.ts`

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Cookies

| Name | HttpOnly | Purpose |
| --- | --- | --- |
| `cw_access` | yes | 15m JWT |
| `cw_refresh` | yes | 30d rotating session |
| `cw_locale` | no | en / si / ta |
| `cw_currency` | no | LKR / USD / AUD / GBP / EUR |
| `cw_theme` | no | pearl / temple / night |

Login and register set auth cookies with `credentials: include`. Frontends never store JWTs in localStorage.
