# Postman — DIYAR API v1

> **Status:** CURRENT — Stage 2 Identity & Access  
> **Last updated:** 2026-08-16

---

## Assets

| Asset | Path |
|-------|------|
| Collection | [`postman/DIYAR-API-v1.postman_collection.json`](./postman/DIYAR-API-v1.postman_collection.json) |
| Local environment | [`postman/DIYAR-API-Local.postman_environment.json`](./postman/DIYAR-API-Local.postman_environment.json) |

---

## Sanctum session authentication in Postman

DIYAR uses **Laravel Sanctum stateful cookies** — not Bearer tokens.

Postman must behave like the React SPA:

| Requirement | Why |
|-------------|-----|
| `Origin` + `Referer` from `frontend_origin` | Sanctum only enables session middleware for stateful domains |
| Cookie Jar enabled | Session + XSRF cookies must persist between requests |
| CSRF before POST | Stateful requests require `X-XSRF-TOKEN` |
| Consistent `base_url` host | Do not mix `localhost` and `127.0.0.1` |

The collection pre-request script automatically sets:

- `Origin: {{frontend_origin}}` (default `http://localhost:3000`)
- `Referer: {{frontend_origin}}/`
- Refreshes CSRF via `GET /sanctum/csrf-cookie` before every POST/PUT/PATCH/DELETE
- `X-XSRF-TOKEN` from the latest `XSRF-TOKEN` cookie (required after login rotates the session)

Login calls `session()->regenerate()`, so **logout and other POSTs must use a fresh CSRF token**, not the one from the initial CSRF Cookie step.

This matches `SANCTUM_STATEFUL_DOMAINS` in `backend/.env` (`localhost:3000,127.0.0.1:3000`).

**Without `Origin`/`Referer`, login may return 200 but `/auth/me` returns 401** because Sanctum does not treat the request as stateful and the session guard is not used.

---

## Import

1. Postman → **Import** → collection + environment
2. Select environment **DIYAR API — Local**
3. Ensure **Cookies** are enabled (Postman settings → Cookies)

---

## Session auth flow (run in order)

1. **Authentication → 1. CSRF Cookie** → expect `204`
2. **Authentication → 2. Login** → expect `200` + session cookie stored
3. **Authentication → 3. Me** → expect `200` + user JSON
4. **Authentication → 4. Logout** → expect `200` (CSRF auto-refreshed before POST)

Or use **Collection Runner** on the Authentication folder in order.

---

## Environment variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `base_url` | `http://localhost:8000` | Laravel API root (no trailing slash) |
| `frontend_origin` | `http://localhost:3000` | SPA origin for Sanctum stateful detection |
| `api_version` | `v1` | API version segment |
| `phone` | `501234567` | Test user phone (national format) |
| `password` | `Password123!` | Test user password |

If your frontend runs on another port, update `frontend_origin` **and** `SANCTUM_STATEFUL_DOMAINS` in `backend/.env`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `/auth/me` → 401 after login | Run CSRF Cookie first; verify Origin headers are sent |
| CSRF token mismatch | Re-import collection fix; run **1. CSRF Cookie** immediately before POST; ensure `base_url` host matches cookie jar (`localhost` ≠ `127.0.0.1`) |
| Cookies not sent | Same `base_url` host everywhere; enable Cookie Jar |
| Login works in browser, not Postman | Postman must send SPA `Origin`, not API URL |

---

## Related

- [AUTHENTICATION.md](./AUTHENTICATION.md)
- [API_CONVENTIONS.md](./API_CONVENTIONS.md)
