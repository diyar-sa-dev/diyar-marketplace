# Stage 13 — Acceptance Matrix

> **Last updated:** 2026-08-19  
> **Legend:** ✅ Done · ➖ N/A · 🔮 Deferred / Future

---

## 13.1 Service Catalog

| Criterion | Status |
|-----------|--------|
| Categories API + seed data | ✅ |
| Services list with DB pagination | ✅ |
| Filters (category, price, sort) | ✅ |
| Service detail page wired | ✅ |
| Provider public profile + portfolio | ✅ |
| Provider follow | ✅ |
| Service wishlist toggle | ✅ |
| Service reviews on catalog cards | ✅ (aggregates from ProviderReview) |

---

## 13.2 Customer RFQ

| Criterion | Status |
|-----------|--------|
| Create request with validation | ✅ |
| Attachments upload | ✅ |
| List/detail own requests | ✅ |
| Cancel while allowed | ✅ |
| Reference links | ✅ |
| Loading/error/empty states | ✅ |

---

## 13.3 Provider Offers

| Criterion | Status |
|-----------|--------|
| Provider submit offer API | ✅ |
| Duplicate offer rejected | ✅ |
| Category match enforcement | ✅ |
| Customer view + accept offer | ✅ |
| Transactional reject sibling offers | ✅ |
| Provider inbox API | ✅ |
| Provider inbox UI | ✅ |
| Provider offer submit UI | ✅ |

---

## 13.4 Booking

| Criterion | Status |
|-----------|--------|
| Booking on offer accept | ✅ |
| Direct booking path | ✅ |
| Provider confirm / propose schedule | ✅ |
| Provider start (post-payment) | ✅ |
| Provider complete | ✅ |
| Payment gate before start | ✅ |
| Provider bookings list UI | ✅ |
| Provider booking detail/actions UI | ✅ |
| Schedule negotiation timeline | ✅ |

---

## 13.5 Service Payment

| Criterion | Status |
|-----------|--------|
| Payment record on booking | ✅ |
| Dev simulate paid/failed | ✅ |
| Customer pay CTA in UI | ✅ |
| Production MyFatoorah | 🔮 Deferred |

---

## 13.6 Provider Portal

| Criterion | Status |
|-----------|--------|
| Dashboard layout + nav | ✅ |
| Role-aware routing | ✅ |
| API client + React Query hooks | ✅ |
| RTL + i18n (EN/AR) | ✅ |

---

## 13.7 Provider Finance

| Criterion | Status |
|-----------|--------|
| Finance summary API | ✅ |
| Analytics / transactions | ✅ |
| Payout request | ✅ |
| Finance UI page | ✅ |

---

## 13.8 Direct Booking & Schedule

| Criterion | Status |
|-----------|--------|
| Direct booking API + idempotency | ✅ |
| Booking preview | ✅ |
| Schedule propose/accept/decline | ✅ |
| Negotiation history fields | ✅ |
| Arabic validation on past dates | ✅ |

---

## 13.9 Provider Reviews

| Criterion | Status |
|-----------|--------|
| Customer review after completed booking | ✅ |
| Duplicate/self-review prevention | ✅ |
| Provider inbox + response | ✅ |
| Public review list on provider profile | ✅ |
| Admin moderation UI | 🔮 Future Admin |

---

## 13.10 Provider Settings

| Criterion | Status |
|-----------|--------|
| Profile / bio / specialty | ✅ |
| Working hours | ✅ |
| Bank account | ✅ |
| Notifications prefs (stored) | ✅ |
| Avatar upload | ✅ |
| Work policy CRUD | ✅ |
| Public work policy summary | ✅ |

---

## Provider Portal sign-off

| Page | Route | Backend | UI | Status |
|------|-------|---------|-----|--------|
| Dashboard | `/dashboard/service` | ✅ | ✅ | ✅ |
| Client requests | `/dashboard/service/client-requests` | ✅ | ✅ | ✅ |
| Request detail | `/dashboard/service/client-requests/:id` | ✅ | ✅ | ✅ |
| Bookings | `/dashboard/service/bookings` | ✅ | ✅ | ✅ |
| My services | `/dashboard/service/services` | ✅ | ✅ | ✅ |
| Finance | `/dashboard/service/finance` | ✅ | ✅ | ✅ |
| Reviews | `/dashboard/service/reviews` | ✅ | ✅ | ✅ |
| Settings | `/dashboard/service/settings` | ✅ | ✅ | ✅ |

**Stage 13 sign-off:** ✅ **COMPLETE**

---

## Security checklist

| Check | Status |
|-------|--------|
| Customer IDOR on requests/bookings | ✅ |
| Provider category scoping | ✅ |
| Provider booking ownership | ✅ |
| Duplicate offer concurrency | ✅ |
| Non-provider dashboard 403 | ✅ |
| Attachment authorization | ✅ |
| Payment ownership (customer) | ✅ |
| Self-review prevention | ✅ |
| Direct booking self-purchase block | ✅ |

---

## Future Admin (not Stage 13)

| Check | Status |
|-------|--------|
| Admin marketplace management UI | 🔮 Documented only |
| Review moderation workflow | 🔮 Future Admin |
| Global booking/RFQ oversight | 🔮 Future Admin |
| Audit log for admin actions | 🔮 Future Admin |

See [FUTURE_ADMIN_MANAGEMENT.md](./FUTURE_ADMIN_MANAGEMENT.md).

---

*Maintained by development team.*
