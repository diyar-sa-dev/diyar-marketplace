# Stage 7 — Vendor Shipping UI Discovery

> **Date:** 2026-08-17  
> **Scope:** Discovery only — **no application code modified**  
> **Trigger:** Vendor Dashboard “الشحن والتوصيل” tab found during Stage 7 pre-planning  
> **Related:** [STAGE_7_ENTRY_AUDIT.md](./STAGE_7_ENTRY_AUDIT.md)

---

## 1. Executive Conclusion

### Classification

```text
FRONTEND MOCK ONLY
```

Vendor-configurable shipping **does not exist** in the backend, database, or API layer.

What **does** exist:

1. A **fully designed Vendor Dashboard UI** for shipping/delivery options (static mock).
2. **Conception/business documents** describing intended per-vendor shipping behavior (`SHIPPING_RULES.md`, `DATABASE_DESIGN.md`, `ORDER_RULES.md`, `PROJECT_SPECIFICATION.md`).
3. **Checkout mock UI** with hardcoded per-vendor shipping amounts (`CheckoutPage.tsx`).

What **does not** exist:

- Persisted vendor shipping settings
- Shipping domain models, migrations, services, routes, or tests
- Any connection between the Vendor Settings “Save shipping settings” button and an API

**Reconciliation with Stage 7 entry audit:** The entry audit correctly found no backend shipping implementation. This discovery confirms the Vendor Dashboard UI is **not evidence of hidden backend support** — it is a **frontend prototype** aligned with planned architecture but **not wired**.

**Architecture classification:** **D — Planned architecture that has not yet been connected** (UI + docs exist; runtime implementation absent).

---

## 2. Existing UI

### 2.1 Primary file

| Item | Value |
|------|-------|
| **Page** | `frontend/src/pages/dashboard/VendorSettings.tsx` |
| **Route** | `/dashboard/vendor/settings` (nested under `/dashboard`) |
| **Router** | `frontend/src/App.tsx` — `ProtectedRoute` roles: `Vendor`, `Admin` |
| **Nav link** | `frontend/src/layouts/DashboardLayout.tsx` — “إعدادات المتجر” → `/dashboard/vendor/settings` |
| **Tab id** | `shipping` (label: `الشحن والتوصيل`) |

### 2.2 State management

```tsx
const [activeTab, setActiveTab] = useState('store');
```

- **Only tab selection** is managed in React state.
- **No** shipping-specific `useState` / `useReducer`.
- **No** TanStack Query hooks.
- **No** API client imports.
- **No** TypeScript types for shipping settings.
- **No** i18n — all shipping tab copy is **hardcoded Arabic**.

The entire `VendorSettings` page (all tabs: store, appearance, business, shipping, account, notifications) follows the same mock pattern.

### 2.3 Shipping tab — available options (UI concept)

Three delivery method cards in a responsive grid:

#### Option A — Shipping companies (شركات الشحن) — visually “selected”

| UI element | Default / behavior |
|------------|-------------------|
| Selection indicator | Static filled checkmark (`border-diyar-brown bg-amber-50/10`) — **not toggled by state** |
| Description | Nationwide delivery via approved carriers (SMSA, Aramex, etc.) |
| **Shipping cost (ر.س)** | `<input type="number" defaultValue="28">` |
| **Free shipping threshold** | Checkbox `defaultChecked` + amount input `defaultValue="300"` SAR |
| Editable | Yes (uncontrolled inputs) |

#### Option B — Warehouse / own delivery (توصيل خاص بالمستودع) — visually “unselected”

| UI element | Default / behavior |
|------------|-------------------|
| Selection indicator | Empty circle — **not interactive** |
| Card styling | `opacity-60`, `cursor-pointer` on card but inner fields `pointer-events-none` |
| **Supported radius** | `<select>` with options: “same warehouse city only”, “50 km radius” — **disabled interaction** |
| **Cost (ر.س)** | `defaultValue="0"`, `disabled` |
| Editable | **Effectively no** — fields blocked |

#### Option C — Store pickup (الاستلام من المعرض) — visually “selected”

| UI element | Default / behavior |
|------------|-------------------|
| Selection indicator | Static filled checkmark |
| **Pickup branch** | `<select>`: “Main branch (Riyadh)”, “Jeddah warehouse” — **hardcoded options** |
| Cost note | Static info: “No delivery cost for this method” |
| Editable | Select is interactive but **not bound to state** |

### 2.4 Save behavior

```tsx
<button className="bg-diyar-brown ...">
  <Save size={18} />
  حفظ إعدادات الشحن
</button>
```

- **No `onClick` handler**
- **No form `onSubmit`**
- **No API call**
- **No toast / success / error feedback**
- **No persistence** to `localStorage`

Same pattern for all other “Save” buttons on the page.

### 2.5 Does the UI expect persisted configuration?

**Visually yes, functionally no.**

The UI is designed *as if* vendors configure:

- Enabled delivery methods (multi-select cards)
- Per-method pricing
- Free-shipping threshold
- Warehouse radius rules
- Pickup branch selection

But there is **zero implementation** behind that expectation — it is a **UX mockup** consistent with `PROJECT_SPECIFICATION.md` line 506: *“Vendor Settings … Form mock”*.

### 2.6 Related frontend shipping UI (also mock)

| File | Role |
|------|------|
| `frontend/src/pages/CheckoutPage.tsx` | Hardcoded `shippingCost: 150` / `50` per mock vendor group; client-side VAT includes shipping |
| `frontend/src/components/modals/CartSidebar.tsx` | Label “Shipping” → `pendingAtCheckout` (no amount) |
| `frontend/src/pages/ProductDetailsPage.tsx` | Static delivery hint i18n (`catalog.productDetail.deliveryTitle`) — not vendor-specific |

---

## 3. Backend Support

### 3.1 Search results

Backend grep for `shipping`, `delivery`, `pickup`, `warehouse`, `radius`, `free shipping`, `shipping cost`, `delivery cost`, `shipping method`, `delivery method`:

| Match | Relevance |
|-------|-----------|
| `CartValidationService.php` | `'shipping' => null` in pending totals |
| `CartResource.php` | `'shipping' => null` in totals |
| `MsegatSmsProvider.php` | SMS “delivery” (unrelated) |
| `welcome.blade.php` | CSS `border-radius` false positive |

**No shipping domain code.**

### 3.2 Models

**None.** `VendorAccount` fillable fields:

```php
user_id, business_name, slug, description, location, status, logo_path, cover_path
```

No `settings` JSON, no shipping columns, no relations to shipping entities.

### 3.3 Migrations

**No shipping-related tables or columns.**

`vendor_accounts` schema (actual migrations):

| Migration | Columns added |
|-----------|---------------|
| `2026_08_16_000003_create_identity_account_stubs_table.php` | `id`, `user_id`, `business_name`, timestamps |
| `2026_08_16_140001_extend_vendor_accounts_table.php` | `slug`, `description`, `location`, `status`, `logo_path`, `cover_path` |

**Not present:** `settings` JSON, shipping cost, free shipping threshold, delivery radius, pickup branches, shipping methods.

### 3.4 Controllers / routes / services

| Area | Shipping support |
|------|------------------|
| `backend/routes/api.php` | **None** — vendor dashboard routes are products + inventory only |
| Controllers | **None** for vendor settings or shipping |
| Services | **None** — no `ShippingService`, `ShippingCalculator`, etc. |
| Form Requests | **None** |
| API Resources | **None** |
| Policies | **None** for shipping |
| Enums | **None** for shipping/delivery method |
| Config (`config/diyar.php`) | **None** — only `inventory.reservation_timeout_minutes`, `cart.max_quantity_per_item` |
| Seeders | **None** |
| Tests | **None** — `grep shipping|delivery|pickup` in `backend/tests` → 0 matches |

### 3.5 Vendor dashboard API (actual)

`frontend/src/api/vendorDashboard.ts` exposes **only**:

- Products CRUD
- Inventory adjust
- Product images

**No settings or shipping endpoints.**

---

## 4. Database Support

### 4.1 Explicit verification

| Concept | Present in DB? |
|---------|----------------|
| Vendor shipping settings | **No** |
| Shipping methods | **No** |
| Delivery methods | **No** |
| Shipping companies | **No** |
| Shipping cost (vendor-level) | **No** |
| Free shipping threshold | **No** |
| Warehouse delivery / radius | **No** |
| Pickup branches | **No** |
| `vendor_orders.shipping_cost` | **No** (orders table does not exist) |
| `shipments` | **No** |

### 4.2 Planned schema (conception only — not migrated)

`conception/architecture/DATABASE_DESIGN.md`:

- `vendor_profiles.settings` JSON — “Shipping prefs, policies” (**not implemented**; codebase uses `vendor_accounts` without `settings`)
- `orders.shipping_total`, `vendor_orders.shipping_cost` — order phase
- Stage 10 entities: `shipping_methods`, `shipping_rules`, `shipping_rates`, `shipments` — **future**

**Do not treat conception schema as existing database support.**

---

## 5. Checkout Relevance

### 5.1 Intended flow (from business docs + UI mocks)

```text
Cart (server items, flat list with product.vendor snapshot)
        ↓
Checkout Preview [auth]
  • Validate cart (reuse CartValidationService)
  • Customer selects shipping_address_id (real Addresses API exists)
  • Customer selects delivery method PER VENDOR (UI concept — not built)
  • Calculate per-vendor shipping from vendor settings (not built)
  • Calculate assembly, discount (=0), VAT (BCMath, config rate)
        ↓
Order (parent totals)
        ↓
VendorOrder A, VendorOrder B (each with shipping_cost snapshot)
        ↓
Shipment record (Phase 7.4 / fulfillment — domain stub)
```

### 5.2 What checkout can use today

| Input | Source today |
|-------|--------------|
| Cart lines | `GET /api/v1/cart` (server-authoritative) |
| Vendor grouping | `cart.items[].product.vendor` snapshot |
| Customer address | `GET /api/v1/profile/addresses` |
| Shipping amount | **Nothing authoritative** — must be introduced in Stage 7 |
| Delivery method choice | **UI mock only** |

### 5.3 PO rule: shipping must not be assumed `0.00`

Evidence supports **non-zero shipping** as the product intent:

- Vendor Settings UI defaults: **28 SAR** carrier shipping, **300 SAR** free threshold
- Checkout mock: **150 SAR** / **50 SAR** per vendor
- `SHIPPING_RULES.md`: flat rate per vendor (default), optional free threshold

Stage 7 **must not** silently default all shipping to zero without PO approval. A **server-side quote** mechanism is required even for V1 minimal implementation.

---

## 6. Multi-Vendor Implications

### 6.1 Cart structure today

Cart items are **flat**, not grouped:

```text
Cart
 ├── item (product A, vendor X, color, qty, unit_price_snapshot)
 ├── item (product B, vendor X, ...)
 └── item (product C, vendor Y, ...)
```

Grouping for checkout happens at preview/order time by `vendor_account_id`.

### 6.2 Multi-vendor checkout (from ORDER_RULES + SHIPPING_RULES)

```text
Cart
 ├── Vendor A items
 └── Vendor B items
        ↓
Order (single payment, global totals)
 ├── VendorOrder A
 │    ├── items[]
 │    ├── shipping_cost (independent)
 │    ├── selected delivery method (TBD)
 │    └── shipment (later)
 └── VendorOrder B
      ├── items[]
      ├── shipping_cost (independent)
      └── ...
```

**Rules (documented):**

- Shipping calculated **per vendor sub-order**, not one global fee (`SHIPPING_RULES.md`, `ORDER_RULES.md`, `PLAN.md` Stage 10.2)
- Each vendor may offer **different methods and prices** (Vendor Settings UI concept)
- Cancelling one vendor order does not auto-cancel siblings (`ORDER_RULES.md`)
- Invariant: `SUM(vendor_order totals)` must reconcile with `order.total` (PO Stage 7 requirement)

### 6.3 Customer UX implication

At checkout, the customer likely needs:

1. One **shipping address** (platform-level)
2. Per-vendor **delivery method selection** (when vendor offers multiple enabled methods)
3. Per-vendor **shipping line** in preview breakdown

None of this is implemented yet. The Vendor Settings UI implies vendors pre-configure which methods are available; checkout would **quote** based on that configuration + cart subtotal (for free-shipping threshold).

### 6.4 Open multi-vendor questions (require PO)

| # | Question |
|---|----------|
| M1 | If Vendor A offers pickup and Vendor B offers carrier only, does customer choose method **per vendor** at checkout? (UI suggests yes) |
| M2 | Is warehouse/radius delivery V1 or deferred? (UI shows it disabled) |
| M3 | Are pickup branches vendor-managed entities or free-text? (UI shows hardcoded select) |
| M4 | Does shipping address determine eligibility for warehouse radius delivery? (Not specified in code) |
| M5 | VAT base: is shipping included in VAT calculation? (`SHIPPING_RULES.md` marks as **OPEN**) |

---

## 7. Stage 7 Planning Impact

**This section documents planning considerations only — no final architecture decided.**

### 7.1 Evidence-based needs for Stage 7

| Capability | Evidence | Likely Stage 7 involvement |
|------------|----------|---------------------------|
| **Vendor shipping configuration (persisted)** | Vendor Settings UI + `DATABASE_DESIGN settings` JSON + `SHIPPING_RULES.md` | **Required for non-zero authoritative quotes** unless PO accepts platform-wide defaults temporarily |
| **Shipping method selection at checkout** | Vendor Settings 3-card UI + checkout mock per-vendor shipping | **Required** if multiple methods per vendor; else single default method |
| **Shipping quote calculation** | `SHIPPING_RULES.md` flat rate + free threshold; checkout mock | **Required in Phase 7.1 preview** |
| **Free-shipping threshold** | Vendor Settings UI checkbox + amount | **Strong product signal** — plan for vendor-level threshold |
| **Warehouse / local delivery** | UI present but disabled | **Defer** unless PO promotes to V1 |
| **Store / showroom pickup** | UI selected by default; zero cost | **Candidate for V1** (simplest method — 0 shipping, may still need method enum) |
| **Shipping company abstraction** | Mentioned in UI copy; Stage 10 full domain | **Defer carrier integration** — flat rate stands in for “carrier shipping” in V1 |
| **Shipment entity / tracking** | `ORDER_RULES`, PO Phase 7.4 | **Domain structure in 7.4**; provider integration deferred |

### 7.2 What can remain deferred (with evidence)

| Item | Defer to | Reason |
|------|----------|--------|
| Carrier API (SMSA, Aramex, etc.) | Stage 10 | UI mentions carriers; no backend hooks |
| Weight/dimension/distance rules | Stage 10 | `SHIPPING_RULES.md` marks as Future |
| `shipping_methods` / `shipping_rules` tables | Stage 10 | PLAN.md Stage 10.1 |
| Warehouse radius geocoding | Post-V1 | UI disabled; no address/geo logic |
| Pickup branch CRUD | Could be V1-lite or deferred | UI uses static `<option>` list |
| Vendor Settings page wiring (full) | Parallel / sub-phase | Entire page is mock; shipping is one tab |

### 7.3 Minimum viable shipping path (for PO discussion — not a decision)

If Stage 7 must ship checkout preview **without** full Vendor Settings API in the same release, options include:

**Option A — Vendor settings persistence first (recommended by UI evidence)**

- Add `vendor_shipping_settings` or `vendor_accounts.settings` JSON
- Wire Vendor Settings shipping tab → API
- Checkout preview reads vendor config → quotes shipping

**Option B — Platform default + snapshot**

- Platform config default flat rate per vendor until settings API exists
- Risk: contradicts Vendor Settings UI expectation; vendors cannot configure

**Option C — Hybrid**

- V1: carrier flat rate + pickup from config/seed defaults
- V1.1: vendor dashboard persistence

**PO must choose** — discovery does not select an option.

### 7.4 Impact on Phase 7.1 (Checkout Preview)

Phase 7.1 **cannot** treat shipping as `null` or hardcoded `0.00` without contradicting:

- Vendor Dashboard shipping UI
- Checkout mock (non-zero amounts)
- `SHIPPING_RULES.md`
- PO explicit instruction

Preview response should include **per-vendor shipping breakdown** with server-calculated amounts, even if V1 uses a simplified rule engine.

### 7.5 Impact on entry audit recommendations

Update planning assumptions from entry audit:

| Entry audit statement | After shipping discovery |
|-----------------------|--------------------------|
| “Flat rate extension point; zero/pending safest V1” | **Revise** — PO + UI + business rules expect **vendor-configurable non-zero shipping** |
| “Stage 10 shipping domain” | Still true for full rules engine; **minimal vendor flat rate + threshold may belong in Stage 7** |
| “No shipping in backend” | Still true — **greenfield shipping config + quote services needed** |

---

## 8. Conception Document Cross-Reference

| Document | Shipping content | Implemented? |
|----------|------------------|--------------|
| `conception/business/SHIPPING_RULES.md` | Per-vendor flat rate, free threshold, snapshot on `vendor_orders` | **No** |
| `conception/business/ORDER_RULES.md` | Independent shipping per vendor order | **No** (no orders) |
| `conception/architecture/DATABASE_DESIGN.md` | `vendor_profiles.settings` JSON; order shipping columns | **No** |
| `conception/architecture/API_SPECIFICATION.md` | Checkout preview with per-vendor `shipping` | **No** |
| `conception/PLAN.md` Stage 10 | Full shipping domain | **Future** |
| `conception/PROJECT_SPECIFICATION.md` | Vendor Settings = form mock; Q13 shipping rules open | **Accurate** |
| `conception/REPOSITORY_AUDIT.md` | “Per-vendor shipping in checkout \| V1” | **Planned, not built** |

---

## 9. File Index

| Purpose | Path |
|---------|------|
| Vendor shipping UI (mock) | `frontend/src/pages/dashboard/VendorSettings.tsx` (L286–425) |
| Route registration | `frontend/src/App.tsx` (L593–599) |
| Dashboard nav | `frontend/src/layouts/DashboardLayout.tsx` (L64) |
| Vendor API (no shipping) | `frontend/src/api/vendorDashboard.ts` |
| Checkout shipping mock | `frontend/src/pages/CheckoutPage.tsx` (L55–73, L125–142) |
| Vendor model (no shipping) | `backend/app/Models/VendorAccount.php` |
| Vendor migrations | `backend/database/migrations/2026_08_16_*_vendor_accounts*` |
| Business rules (intent) | `conception/business/SHIPPING_RULES.md` |
| DB design (intent) | `conception/architecture/DATABASE_DESIGN.md` §3.2, §3.5 |
| Spec acknowledgment | `conception/PROJECT_SPECIFICATION.md` L506, L899, Q13 |

---

## 10. Stop Point

Per PO instructions:

- ✅ Discovery document complete
- ❌ `STAGE_7_PLAN.md` **not created**
- ❌ Phase 7.1 **not implemented**
- ❌ Application code **not modified**

**Awaiting Product Owner review** of this shipping discovery before Step 2 (Stage 7 plan).

---

*Evidence gathered from live repository inspection on 2026-08-17.*
