# Phase 28.4 — Frontend Route Inventory

**Source:** `StorefrontRoutes.tsx`, `DashboardRoutes.tsx`, `AdminShell.tsx`  
**Raw:** `_frontend_route_inventory.json` — **101 route definitions**, **98 unique paths**

---

## Shell architecture

| Shell | Path prefix | Auth |
|-------|-------------|------|
| Marketplace | `/` (default) | Sanctum session via `AuthContext` |
| Admin SPA | `/admin/*` | Separate `AdminAuthContext` |

`App.tsx` switches shell when `pathname.startsWith('/admin')`.

---

## Public / catalog (storefront)

| Route | Guard | Page |
|-------|-------|------|
| `/` | None | Home |
| `/search` | None | Search |
| `/category/:id` | None | Category |
| `/product/:id` | None | Product details |
| `/store/:id` | None | Vendor store |
| `/provider/:id` | None | Provider profile |
| `/services`, `/service/:id` | None | Services catalog |
| `/b2b`, `/b2b/:id` | None | B2B directory |
| `/blog`, `/blog/:slug`, `/blog/tag/:tagSlug` | None | Blog/CMS |
| `/loyalty` | None (guest UI inside) | Loyalty |
| `/ai-designer` | None | AI designer |
| `/auth` | GuestRoute | Login/register |
| `/403` | None | Forbidden |

---

## User / customer (authenticated)

| Route | Guard |
|-------|-------|
| `/checkout`, `/checkout/payment/*` | ProtectedRoute + MarketplaceCommerceRoute |
| `/orders` | CustomerProfileRoute |
| `/profile/*` | CustomerProfileRoute / ProtectedRoute |
| `/wishlist` | CustomerProfileRoute |
| `/chat` | ProtectedRoute |
| `/account/pending`, `/account/suspended` | AccountStatusRoute |

---

## Dashboard (`/dashboard/*`) — role-scoped

| Portal | Routes (sample) | Role guard |
|--------|-------------------|------------|
| **Vendor** | orders, products, coupons, finance, analytics, settings, b2b, messages | `RoleName.Vendor` |
| **Provider** | services, bookings, client-requests, finance, analytics, settings | `RoleName.Provider` |
| **Affiliate** | products, links, reports, payouts, settings | `RoleName.Marketer` |
| Index | `/dashboard` | ProtectedRoute (role redirect) |

---

## Admin (`/admin/*`)

| Route | Purpose |
|-------|---------|
| `/admin/login` | AdminGuestRoute |
| `/admin` | Dashboard |
| `/admin/users`, `/admin/users/:userId` | User mgmt |
| `/admin/vendors`, `/admin/providers` | Partner mgmt |
| `/admin/payments`, `/admin/shipping` | Ops |
| `/admin/b2b/companies` | B2B admin |
| `/admin/blog/articles`, `/admin/projects` | CMS |
| `/admin/analytics`, `/admin/chat` | Analytics/moderation |
| `/admin/finance`, `/admin/audit`, `/admin/settings` | Finance/config |
| Legacy redirects | `/admin/payouts` → finance, analytics subpaths → hash |

---

## Route guards (usage counts)

| Guard | Purpose |
|-------|---------|
| `ProtectedRoute` | Session required; pending/suspended redirects |
| `GuestRoute` | Redirect authenticated users away from `/auth` |
| `CustomerProfileRoute` | Customer-only profile paths |
| `ProtectedAdminRoute` | Admin session + permissions |
| `MarketplaceCommerceRoute` | Commerce/maintenance gate |

Vitest: `routes.test.tsx` — **6 tests PASS** (loading, redirect unauthenticated, pending, guest redirect).

---

## Observations

| Finding | Classification |
|---------|----------------|
| French locale routes | **N/A** — no `fr` in `SUPPORTED_LOCALES` |
| `/dashboard/*` wildcard nests 30+ child routes | Lazy-loaded |
| Admin unknown paths → redirect `/admin` | No 404 admin page |
| Projects modal not a dedicated route | Sidebar overlay on `/` |

---

## Inventory gate

```text
PASS
```
