# DIYAR V1 — MANUAL BROWSER ACCEPTANCE TEST PLAN

**Scope:** Six roles + cross-role workflows  
**Manual environment:** `diyar-lap` — PHP-FPM + MySQL/XAMPP, no Docker/Redis  
**Automated environment:** `diyar-dev` — desktop PC + Docker + local VPS-equivalent simulation  
**Target:** Validate existing V1 functionality before the VPS release decision.

## Test execution rules

- Use local/test data only. Never run destructive test cases against the real production VPS.
- Verify the actual role names, permissions and implemented features against the current application before testing.
- Start with read-only actions. Create test records only where necessary.
- Use separate browser profiles or clean sessions for different accounts. Never assume that changing the visible name changes the authenticated identity.
- Record the account/role, test ID, steps, expected result, actual result, evidence, and defect ID.
- Do not change code during the initial acceptance pass. Record defects as tasks and fix them only through the approved workflow.
- Do not use real payment credentials or initiate real charges. Use a sandbox or approved local test path.
- Do not mark a feature PASS because its page loads. Complete its business workflow and verify the persisted result where possible.

## Status values

- NOT RUN — not attempted.
- PASS — all expected outcomes verified.
- FAIL — reproducible mismatch or defect.
- BLOCKED — dependency, environment or missing test data prevents verification.
- NOT APPLICABLE — confirmed outside the V1 scope.
- RETEST REQUIRED — defect was fixed and needs revalidation.

## Priority

- P0 — security/privacy breach, data corruption, unauthorized financial change, or severe system failure.
- P1 — core business workflow broken, unauthorized access, or critical data inconsistency.
- P2 — important functionality degraded, with a reasonable workaround.
- P3 — cosmetic or low-impact usability issue.

---

# A. Guest — unauthenticated visitor

**Goal:** Confirm that a visitor can discover the marketplace and use permitted guest features without accessing private or authenticated functionality.

| ID | Test | Procedure | Expected result | Priority |
|---|---|---|---|---|
| G-01 | Open marketplace | Open the local homepage in a clean browser session. | Page loads; no unexpected error or authenticated user state. | P1 |
| G-02 | Navigate public pages | Open category, product, service, public seller/provider profile and other implemented public pages. | Public content loads; unavailable content has a clear fallback. | P2 |
| G-03 | Browse categories | Navigate categories and subcategories; open a listing. | Correct category and item details appear. | P2 |
| G-04 | Search | Search by a known product/service name; try no results and empty input. | Relevant results or a clear empty state; no crash. | P1 |
| G-05 | Filters and sorting | Apply available category, price, availability and sorting filters. | Results match the selected filters; clearing filters restores results. | P2 |
| G-06 | Product details | Open product images, variants, price and stock information. | Displayed data is consistent with the selected item. | P1 |
| G-07 | Service details | Open a service listing and inspect provider, price and available booking information. | Correct public information; private provider information remains hidden. | P1 |
| G-08 | Guest cart | Add an eligible product to the cart; refresh and navigate away and back. | Cart persistence follows the designed guest-session behavior. | P1 |
| G-09 | Guest cart isolation | Open a separate clean browser session and inspect its cart. | One visitor cannot read or modify another visitor's cart. | P0 |
| G-10 | Guest checkout boundary | Attempt checkout or a protected action that requires login. | Login/registration is requested at the correct point; no unauthorized order is created. | P1 |
| G-11 | Login and registration entry | Open login, registration and password recovery pages. | Forms load, labels are clear, and invalid inputs are handled safely. | P1 |
| G-12 | Protected URL | Open a protected dashboard URL directly while logged out. | Access is denied or redirected appropriately; no private data is rendered. | P0 |
| G-13 | Invalid route | Open a nonexistent URL and a malformed item URL. | Controlled 404/validation response, not a raw exception or sensitive debug output. | P2 |
| G-14 | Arabic and layout | Navigate public pages in Arabic RTL and check mobile-width layout. | Direction, text, menus, cards and controls remain usable. | P2 |

**Guest completion gate:** All P0/P1 cases pass. Record any guest-cart or checkout behavior that differs from the documented product design.

---

# B. Customer

**Goal:** Verify the complete customer experience from authentication through shopping, ordering and post-order activity.

| ID | Test | Procedure | Expected result | Priority |
|---|---|---|---|---|
| C-01 | Login | Sign in with the dedicated customer account. | Correct customer session and customer interface. | P1 |
| C-02 | Invalid login | Try incorrect credentials and malformed form values. | Safe error message; no login or private data disclosure. | P1 |
| C-03 | Profile | View and edit permitted profile fields; refresh. | Valid changes persist; forbidden fields cannot be changed. | P2 |
| C-04 | Account isolation | Open another customer's known resource URL while signed in. | Access denied unless explicitly shared by design. | P0 |
| C-05 | Addresses | Create, edit, select and remove an address using test data. | Correct persistence and validation; default-address rules work. | P1 |
| C-06 | Browse and search | Search, filter, sort and open product listings. | Correct results and details; no stale or inconsistent displayed data. | P2 |
| C-07 | Wishlist | Add/remove an item and reload the page. | Wishlist state persists for the correct customer. | P2 |
| C-08 | Cart operations | Add items, change quantities, remove items and refresh. | Correct quantities and totals; invalid quantities rejected. | P1 |
| C-09 | Stock boundary | Attempt to purchase an unavailable or insufficient-stock item. | Checkout prevents invalid purchase; inventory remains consistent. | P0 |
| C-10 | Price and VAT | Review item prices, shipping charges, discounts and VAT where applicable. | Totals follow the documented pricing rules; no client-side price manipulation is trusted. | P0 |
| C-11 | Checkout validation | Submit checkout with missing or invalid required fields. | Clear validation; no partial or duplicate order. | P1 |
| C-12 | Successful order | Complete checkout using an approved local/sandbox payment path or an implemented valid alternative. | One order is created with correct items, totals, address and initial status. | P0 |
| C-13 | Failed/cancelled payment | Simulate a supported payment failure or cancellation. | Order/payment state follows the designed failure flow; no false successful payment. | P0 |
| C-14 | Order history | Open order history and order detail. | Only the current customer's orders are visible. | P0 |
| C-15 | Order lifecycle | Follow the order through the statuses that are available in the test environment. | Status changes are valid and visible to the customer. | P1 |
| C-16 | Cancellation/refund | Attempt only supported cancellation/refund paths using test data. | Eligibility and financial rules are enforced; duplicate refunds are prevented. | P0 |
| C-17 | Notifications | Trigger an implemented order or account notification. | Correct recipient and content; no cross-account leakage. | P1 |
| C-18 | Chat | If implemented, open a permitted conversation and send/receive a message. | Only authorized participants can read or send messages. | P0 |
| C-19 | Service booking | Select a service/provider and complete the implemented booking flow. | Correct booking details and status; no unauthorized provider selection. | P1 |
| C-20 | Logout/session | Log out, press Back and reopen a protected URL. | Protected data cannot be accessed after logout. | P0 |

**Customer completion gate:** Core checkout, ownership isolation, pricing, stock and payment-state behavior must pass before release acceptance.

---

# C. Seller / Vendor

**Goal:** Verify seller onboarding, store/product management and the seller's permitted order operations.

| ID | Test | Procedure | Expected result | Priority |
|---|---|---|---|---|
| S-01 | Seller login | Sign in with a dedicated seller account. | Correct seller dashboard and permissions. | P1 |
| S-02 | Onboarding | Review or complete the implemented seller onboarding flow. | Required fields validated; approval state is accurate. | P1 |
| S-03 | Approval boundary | Use a pending or suspended seller account if available. | Restricted actions remain unavailable until authorized. | P0 |
| S-04 | Store profile | View and update permitted store details. | Changes persist and public information is correctly presented. | P2 |
| S-05 | Product creation | Create a test product with required fields and valid media. | Product saves with correct seller ownership and expected moderation/status. | P1 |
| S-06 | Product validation | Submit missing fields, invalid prices or invalid media. | Validation rejects invalid input safely. | P1 |
| S-07 | Product editing | Edit a product's description, price and permitted fields. | Changes persist; protected fields cannot be manipulated. | P1 |
| S-08 | Product lifecycle | Publish, unpublish or archive using implemented actions. | Only valid state transitions are allowed. | P1 |
| S-09 | Inventory | Change stock and inspect the customer-facing listing. | Stock updates correctly; invalid stock values are rejected. | P0 |
| S-10 | Product ownership | Try editing another seller's product using a known test ID. | Request is denied; the other seller's data is unchanged. | P0 |
| S-11 | Order list | Open seller orders generated by a test customer purchase. | Seller sees only orders/items they are authorized to manage. | P0 |
| S-12 | Fulfillment | Perform permitted accept, prepare, ship or completion actions. | Valid transitions succeed; invalid transitions are rejected. | P1 |
| S-13 | Multi-vendor order | If supported, inspect an order containing products from multiple sellers. | Each seller sees only their authorized items and data. | P0 |
| S-14 | Analytics | Open implemented seller statistics/reports. | Counts and totals are scoped to the seller. | P1 |
| S-15 | Commissions/payouts | If implemented, inspect commission, balance and payout records. | Amounts and statuses match recorded business rules. | P0 |
| S-16 | Seller communications | If implemented, open authorized order/customer conversations. | Only permitted participants can access the conversation. | P0 |
| S-17 | Logout/session | Log out and try to reopen seller pages. | Seller dashboard and private data remain inaccessible. | P0 |

**Seller completion gate:** Product ownership, stock integrity and order visibility must pass. Do not treat the presence of a seller dashboard as evidence that seller workflows work.

---

# D. Service Provider

**Goal:** Verify provider onboarding, service listings, booking lifecycle and separation from other providers.

| ID | Test | Procedure | Expected result | Priority |
|---|---|---|---|---|
| SP-01 | Provider login | Sign in using the dedicated service-provider account. | Correct provider dashboard and permissions. | P1 |
| SP-02 | Onboarding | Review or complete the implemented provider registration flow. | Required details validated and review status displayed correctly. | P1 |
| SP-03 | Approval restriction | Test a pending or suspended provider account if available. | Restricted service/booking actions are blocked as designed. | P0 |
| SP-04 | Provider profile | Edit permitted profile and public service information. | Changes persist; private fields are not exposed publicly. | P2 |
| SP-05 | Service management | Create/edit a service if the role supports it. | Correct ownership, validation and visibility behavior. | P1 |
| SP-06 | Price and availability | Update permitted pricing, working hours or availability. | Valid changes persist; invalid values are rejected. | P1 |
| SP-07 | Public listing | Open the provider's public page as a guest/customer. | Public information reflects approved changes only. | P1 |
| SP-08 | Booking list | Create a customer test booking and open provider bookings. | Only authorized bookings are shown. | P0 |
| SP-09 | Booking acceptance | Accept or reject a booking if supported. | Only permitted state transitions succeed. | P1 |
| SP-10 | Booking completion | Complete a valid test booking through its supported lifecycle. | Customer and provider observe consistent status. | P1 |
| SP-11 | Cancellation | Test allowed and disallowed cancellation paths. | Policy is enforced and status remains consistent. | P0 |
| SP-12 | Double booking | Attempt overlapping or duplicate booking where the feature supports availability controls. | Conflicting bookings are prevented according to business rules. | P0 |
| SP-13 | Provider isolation | Try opening another provider's booking or editing their service. | Access denied; no other provider's data changes. | P0 |
| SP-14 | Chat and notifications | If implemented, exchange a booking-related message and trigger a notification. | Correct recipients and conversation permissions. | P0 |
| SP-15 | Earnings/reports | If implemented, inspect earnings, commissions and reports. | Data is scoped correctly and matches recorded transactions. | P1 |
| SP-16 | Logout/session | Log out and reopen provider URLs. | Protected provider data is inaccessible. | P0 |

**Provider completion gate:** Booking ownership, availability conflicts and lifecycle consistency must pass for implemented booking features.

---

# E. Referral / Affiliate

**Goal:** Verify referral eligibility, attribution, commission visibility and data isolation.

| ID | Test | Procedure | Expected result | Priority |
|---|---|---|---|---|
| R-01 | Login and eligibility | Sign in with the dedicated referral account. | Correct referral interface and eligibility status. | P1 |
| R-02 | Referral link/code | Open and copy an available referral link or code. | Link/code is valid and tied to the correct account. | P1 |
| R-03 | Link validation | Open the referral link in a clean browser session. | Referral attribution is recorded according to the implemented rules. | P1 |
| R-04 | Registration attribution | Use a fresh test account to follow the referral registration flow. | Attribution is assigned according to documented rules. | P1 |
| R-05 | Conversion attribution | Complete an eligible test purchase using the referral path. | Conversion is recorded once and associated with the correct referral. | P0 |
| R-06 | Commission calculation | Inspect the commission generated by an eligible test conversion. | Amount and status match the configured rules. | P0 |
| R-07 | Duplicate event | Repeat a conversion-triggering action or refresh relevant pages. | No duplicate conversion or commission is created. | P0 |
| R-08 | Self-referral | Attempt a prohibited self-referral scenario using test accounts. | Disallowed attribution is rejected or excluded as designed. | P0 |
| R-09 | Invalid/expired code | Open an invalid, expired or unavailable code if supported. | Safe failure; no unintended attribution. | P1 |
| R-10 | Commission lifecycle | Review pending, approved, cancelled or paid statuses where implemented. | Status transitions match the actual business rules. | P1 |
| R-11 | Other referrals | Attempt to open another affiliate's referral/commission record. | Access denied; private financial data remains hidden. | P0 |
| R-12 | Withdrawal/payout | If implemented, inspect or submit a test payout request. | Eligibility and amount checks work; no real payment is triggered. | P0 |
| R-13 | Reports | Open implemented referral analytics. | Counts and amounts match eligible attributed events. | P1 |
| R-14 | Logout/session | Log out and reopen referral pages. | Referral dashboard data is inaccessible. | P0 |

**Referral completion gate:** Attribution, commission correctness, duplicate prevention and financial data isolation must pass.

---

# F. Admin

**Goal:** Verify administrative access, moderation, account controls, operational visibility and role-based restrictions.

Use a dedicated local test administrator. If the system has different admin/staff permission levels, test each relevant level separately.

| ID | Test | Procedure | Expected result | Priority |
|---|---|---|---|---|
| A-01 | Admin login | Sign in with the dedicated administrator account. | Correct admin dashboard and authenticated identity. | P0 |
| A-02 | Invalid admin login | Try incorrect credentials and repeated failures using the approved local test path. | Safe rejection and configured protections behave correctly. | P0 |
| A-03 | Admin session | Inspect session expiration and logout behavior. | Session protections work; logout invalidates access. | P0 |
| A-04 | User lookup | Search for test users and open permitted profiles. | Correct records appear; sensitive fields are appropriately protected. | P1 |
| A-05 | Seller approval | Approve/reject a test seller if the workflow exists. | Status changes persist and affect seller permissions correctly. | P0 |
| A-06 | Provider approval | Approve/reject a test service provider if implemented. | Status and public visibility update correctly. | P0 |
| A-07 | Suspension | Suspend a test account, then verify its permitted/restricted actions. | Suspension takes effect and is recorded correctly. | P0 |
| A-08 | Catalog moderation | Review and moderate a test product/listing. | Valid moderation actions work and update visibility. | P1 |
| A-09 | Order inspection | Open test orders and verify authorized administrative details. | Correct order data and lifecycle status appear. | P1 |
| A-10 | Payment/refund controls | If implemented, inspect payment records and use only approved sandbox refund flows. | Financial operations enforce authorization and idempotency. | P0 |
| A-11 | Disputes/support | If implemented, inspect and process a test dispute/support case. | Only allowed state transitions succeed and changes are traceable. | P1 |
| A-12 | Roles and permissions | Attempt restricted actions with a limited staff account, if available. | Least-privilege permissions are enforced in the backend and UI. | P0 |
| A-13 | Audit trail | Perform a test administrative change and inspect its audit record if supported. | Actor, action and relevant event details are recorded. | P1 |
| A-14 | Reports/exports | Open reports and export a small test dataset if supported. | Export is authorized and contains only permitted data. | P1 |
| A-15 | Configuration controls | Inspect implemented system settings without changing production-like secrets. | Only authorized settings are available and validated. | P0 |
| A-16 | Customer data isolation | Try accessing restricted customer records or modifying resources through direct URLs. | Access and field-level restrictions are enforced. | P0 |
| A-17 | Admin/API boundary | Verify direct protected URLs and applicable API actions without the required role. | Backend denies unauthorized requests even if the UI hides the action. | P0 |
| A-18 | Logout/session | Log out, press Back and reopen admin URLs. | No protected admin data is available without a valid session. | P0 |

**Admin completion gate:** Authentication, privilege boundaries, approval/suspension effects and financial controls must pass. An admin page loading successfully is not enough.

---

# G. Multi-role end-to-end workflows

Run these only after the individual role tests are sufficiently stable. Use identifiable test records and retain the IDs so each step can be checked across roles.

## WF-01 — Guest discovery to customer purchase

1. Guest opens a public product listing.
2. Guest searches and filters the catalog.
3. Guest adds an eligible item to the cart.
4. Guest proceeds to the required authentication step.
5. Customer signs in or registers through the supported flow.
6. Customer verifies the cart and checkout details.
7. Customer completes an approved test order.
8. Customer opens the order history.

**Verify:** Cart handoff follows the intended design; only one order exists; price, VAT, shipping, stock and customer ownership are correct.

## WF-02 — Customer order through seller fulfillment

1. Customer creates a test purchase.
2. Seller opens the corresponding authorized order/item.
3. Seller performs the next permitted fulfillment action.
4. Customer refreshes order details.
5. Admin inspects the same order if permitted.
6. Seller and customer review final status.

**Verify:** All roles see consistent status; seller cannot access unrelated sellers' private order data; transitions cannot be skipped improperly.

## WF-03 — Multi-vendor order

1. Create an order containing items from two test sellers, if supported.
2. Seller A opens the order.
3. Seller B opens the order.
4. Each seller attempts to access the other seller's restricted data.
5. Customer and admin inspect the order.

**Verify:** Item ownership and fulfillment boundaries are correct. Do not assume the marketplace supports multi-vendor checkout unless confirmed in the current implementation.

## WF-04 — Customer service booking through provider

1. Customer discovers an approved provider.
2. Customer creates a test booking.
3. Provider sees the booking.
4. Provider performs the permitted acceptance/rejection action.
5. Customer checks the resulting status.
6. Provider completes the supported lifecycle.
7. Customer and admin inspect the final state.

**Verify:** Correct provider, customer, price, availability and status are preserved; no unrelated user can modify the booking.

## WF-05 — Referral conversion and commission

1. Referral account obtains its link/code.
2. A clean browser follows the referral link.
3. A fresh eligible test customer registers or completes the supported attribution flow.
4. Customer makes an eligible sandbox/test purchase.
5. Referral account inspects conversion and commission.
6. Admin inspects the corresponding records if permitted.
7. Repeat a safe duplicate-trigger attempt.

**Verify:** Attribution is correct, commission is calculated once, duplicate events do not create extra commission, and users cannot inspect other affiliates' financial records.

## WF-06 — Seller onboarding and approval

1. Test seller completes the available onboarding process.
2. Seller checks the pending state.
3. Admin reviews and approves/rejects the seller.
4. Seller refreshes the dashboard.
5. Seller attempts a previously restricted action.
6. Guest/customer checks public seller/product visibility as appropriate.

**Verify:** Approval is enforced server-side, not just by hiding UI controls; public visibility matches the intended approval policy.

## WF-07 — Service-provider onboarding and approval

1. Test provider completes onboarding.
2. Admin reviews and approves/rejects the provider.
3. Provider attempts service publication or booking-related actions.
4. Guest/customer checks provider visibility.
5. Admin suspends the test provider if supported.
6. Verify the suspension's effect on future actions.

**Verify:** Account status consistently governs permissions and public visibility.

## WF-08 — Payment lifecycle and webhook effects

1. Create a test order using the approved payment test path.
2. Trigger the supported success, failure or cancellation case.
3. Inspect the order and payment states.
4. Where a safe local test mechanism exists, submit an authorized duplicate-event/replay test.
5. Inspect the final records from the customer/admin views.

**Verify:** Invalid signatures are rejected; duplicate events do not produce duplicate financial effects; order/payment states remain consistent. Never simulate provider callbacks against a real production endpoint without explicit authorization.

## WF-09 — Cancellation, refund and inventory consistency

1. Create a test order.
2. Attempt a supported cancellation or refund.
3. Inspect the resulting order/payment status.
4. Check inventory and any applicable commission state.
5. Repeat the same request only where safe to verify duplicate protection.

**Verify:** The system applies its documented cancellation/refund policy exactly once and maintains consistent financial and stock records.

## WF-10 — Cross-role access-control challenge

1. Sign in as each role in a separate browser profile.
2. Record the IDs of test resources owned by other accounts.
3. Attempt direct URL access to those resources.
4. Where safely available, attempt corresponding API requests through the approved local test mechanism.
5. Verify whether access is allowed or denied according to the policy.
6. Inspect the original resource to ensure no unauthorized mutation occurred.

**Verify:** Hiding a button is never the only security boundary. Unauthorized requests must be rejected server-side.

---

# H. Shared usability and regression checks

Run these across all six roles, where relevant:

| ID | Check | Expected result |
|---|---|---|
| UX-01 | Arabic RTL | Text, alignment, menus, dialogs, tables and forms follow RTL layout correctly. |
| UX-02 | Navigation | Active menu, back navigation and direct page URLs behave consistently. |
| UX-03 | Form errors | Required fields, invalid formats and server errors have clear feedback. |
| UX-04 | Loading/empty states | Lists, dashboards and search results show usable loading and empty states. |
| UX-05 | Responsive layout | Common desktop and laptop/browser widths do not hide critical controls. |
| UX-06 | Refresh/persistence | Expected state remains after refresh; transient state behaves as designed. |
| UX-07 | Double-click/retry | Repeated submission does not accidentally duplicate critical operations. |
| UX-08 | Session expiry | Expired sessions produce a controlled response and preserve no unauthorized access. |
| UX-09 | Error handling | No raw stack traces, debug secrets or sensitive internal details are shown. |
| UX-10 | Browser console | Record JavaScript errors, failed requests and unexpected warnings. Investigate meaningful failures. |

---

# I. Evidence and final acceptance

For each case, record:

- Test ID and role.
- Test date and browser.
- Environment identifier and current commit/build.
- Test account identifier or masked label.
- Test data/resource IDs.
- Steps executed.
- Expected and actual results.
- Status and priority.
- Screenshot or sanitized request/response evidence where useful.
- Linked defect/task and retest result.

Do not put passwords, access tokens, session cookies, private customer information or payment secrets in screenshots or reports.

## Release-candidate acceptance gates

1. All P0 tests pass.
2. All core P1 tests pass or have a documented, explicitly accepted exception.
3. All six roles have completed the relevant implemented workflows.
4. All applicable multi-role workflows have been executed.
5. No unresolved P0/P1 defect remains.
6. Security and cross-account isolation tests pass.
7. Automated tests are freshly executed on the recorded desktop commit.
8. Laptop-only limitations are clearly recorded; infrastructure-dependent features are not falsely marked verified.
9. Fixed defects are retested, and regression tests are added where appropriate.
10. A final report records what is VERIFIED, DOCUMENTED ONLY, BLOCKED and NOT VERIFIED.
11. Product-owner acceptance is recorded separately from authorization to deploy to the real VPS.
