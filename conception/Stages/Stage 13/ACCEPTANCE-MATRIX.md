# Stage 13 — Acceptance Matrix

> **Last updated:** 2026-08-18  
> **Legend:** ✅ Done · ⏳ Pending · ➖ N/A · 🔮 Deferred

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
| Service reviews on catalog | 🔮 Stage 14.2 |

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
| Provider inbox UI (no mocks) | ⏳ **PENDING** |
| Provider offer submit UI | ⏳ **PENDING** |

---

## 13.4 Booking

| Criterion | Status |
|-----------|--------|
| Booking on offer accept | ✅ |
| Provider start (post-payment) | ✅ |
| Provider complete | ✅ |
| Payment gate before start | ✅ |
| Provider bookings list UI | ⏳ **PENDING** |
| Provider booking detail/actions UI | ⏳ **PENDING** |

---

## 13.5 Service Payment

| Criterion | Status |
|-----------|--------|
| Payment record on booking | ✅ |
| Dev simulate paid/failed | ✅ |
| Customer pay CTA in UI | ✅ |
| Production MyFatoorah | 🔮 Deferred |

---

## Provider Portal (sign-off gate)

| Page | Route | Backend | UI wired @ HEAD | Required for sign-off |
|------|-------|---------|-----------------|----------------------|
| Client requests | `/dashboard/service/client-requests` | ✅ | ⏳ Mock | ✅ |
| Request detail + offer | `/dashboard/service/client-requests/:id` | ✅ | ⏳ Mock | ✅ |
| Bookings | `/dashboard/service/bookings` | ✅ | ⏳ Mock | ✅ |

**Stage 13 sign-off:** ⏳ **BLOCKED** until Provider Portal row is ✅.

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

---

*Maintained by development team.*
