# Platform Flow Matrix

**Phase:** 28.16 Enterprise Platform QA  
**Source:** Routes, Playwright specs, PHPUnit feature tests, frontend routes

Legend: **E** = E2E Playwright | **A** = API/Feature test | **—** = gap

---

## Guest / Public

| Flow | Steps | E | A | Priority |
|------|-------|:-:|:-:|----------|
| Homepage browse | `/` → categories → products | ✓ | ✓ | P0 |
| Catalog search | `/search` → results | ✓ | ✓ | P0 |
| Product detail | `/products/:id` | ✓ | ✓ | P0 |
| Services browse | `/services` → filters | ✓ | ✓ | P1 |
| Vendor storefront | `/vendors/:slug` | partial | ✓ | P1 |
| B2B directory | `/b2b` → company | ✓ | ✓ | P1 |
| Blog | `/blog` → article | ✓ | ✓ | P2 |
| Public cart (session) | add/view cart guest | ✓ | ✓ | P0 |
| Protected route denial | `/profile` → redirect | partial | ✓ | P0 |
| Storefront home aggregate | `GET /storefront/home` | — | ✓ | P1 |

---

## Authentication

| Flow | E | A | Priority |
|------|:-:|:-:|----------|
| Register (valid/invalid) | — | ✓ | P0 |
| Login / logout | ✓ | ✓ | P0 |
| OTP / SMS | — | ✓ | P1 |
| Password reset | — | ✓ | P1 |
| Session isolation (marketplace/admin) | ✓ | ✓ | P0 |
| Rate limit login | — | ✓ | P0 |
| `/auth/me` dedup | — | ✓ | P2 |

---

## Customer

| Flow | E | A | Priority |
|------|:-:|:-:|----------|
| Browse → wishlist | partial | ✓ | P1 |
| Cart merge on login | — | ✓ | P0 |
| Checkout preview | — | ✓ | P0 |
| Payment (fake gateway) | — | ✓ | P0 |
| Order creation | — | ✓ | P0 |
| Order view / cancel | — | ✓ | P0 |
| Returns request | — | ✓ | P1 |
| Reviews | — | ✓ | P1 |
| Notifications | ✓ UI | ✓ | P1 |
| Chat | ✓ UI | ✓ | P1 |
| Loyalty | ✓ | ✓ | P2 |
| Profile / addresses | partial | ✓ | P1 |
| **Full UI checkout journey** | **—** | partial | **P0 GAP** |

---

## Vendor

| Flow | E | A | Priority |
|------|:-:|:-:|----------|
| Login → dashboard | ✓ | ✓ | P0 |
| Products list | ✓ | ✓ | P0 |
| Product CRUD | — | ✓ | P0 |
| Orders list | ✓ | ✓ | P0 |
| Order fulfillment | — | ✓ | P0 |
| Store settings / logo | ✓ | ✓ | P1 |
| Analytics | ✓ | ✓ | P2 |
| B2B partner | — | ✓ | P2 |
| Team invites | — | ✓ | P2 |
| IDOR (vendor A → B) | — | ✓ | P0 |

---

## Provider

| Flow | E | A | Priority |
|------|:-:|:-:|----------|
| Login → dashboard | ✓ | ✓ | P0 |
| Services management | ✓ | ✓ | P0 |
| Bookings / RFQ | — | ✓ | P1 |
| Finance | — | ✓ | P1 |
| IDOR (provider A → B) | — | partial | P0 |

---

## Affiliate (marketer)

| Flow | E | A | Priority |
|------|:-:|:-:|----------|
| Dashboard | — | ✓ | P1 |
| Links / tracking | — | ✓ | P1 |
| Commissions | — | ✓ | P1 |
| Click / resolve (public) | — | ✓ | P1 |
| **E2E affiliate journey** | **—** | ✓ | **P2 GAP** |

---

## Admin

| Flow | E | A | Priority |
|------|:-:|:-:|----------|
| Login → dashboard | ✓ | ✓ | P0 |
| Users / vendors / providers | partial | ✓ | P0 |
| Orders / payments | — | ✓ | P0 |
| Blog CMS | ✓ | ✓ | P1 |
| B2B CMS | ✓ | ✓ | P1 |
| Shipping config | ✓ | ✓ | P1 |
| Analytics | ✓ | ✓ | P2 |
| Chat moderation | ✓ | ✓ | P1 |
| Maintenance mode | ✓ | ✓ | P1 |
| Finance / payouts | — | ✓ | P0 |
| Permission matrix | — | partial | **P0 GAP** |

---

## Realtime (Reverb)

| Flow | E | A | Priority |
|------|:-:|:-:|----------|
| WebSocket connect | — | — | P0 |
| Private channel auth | — | partial | P0 |
| Chat message delivery | — | partial | P0 |
| Notification push | — | partial | P1 |
| Reconnect | — | — | P1 |
