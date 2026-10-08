# DIYAR — STEP 13B.2 REPORT
# REALISTIC MARKETPLACE BUSINESS-FLOW LOAD TESTING

**Document Type:** Business-Flow Concurrency & Data Integrity Certification  
**Phase:** Modular Monolith Architecture — Step 13B.2  
**Date:** 2026-10-08  
**Authority:** Senior Laravel Architect, QA Automation Lead, Performance Engineer  
**Environment:** Local Docker VPS Production Simulation (`diyar-vps-sim`) ONLY  
**Production VPS:** STRICTLY OUT OF SCOPE (Hostinger VPS Never Touched)  
**Status:** **CERTIFIED**  

---

## 1. Executive Summary

Step 13B.2 validates that DIYAR maintains strictly correct business state, inventory counters, multi-tenant isolation, authorization barriers, and financial calculations under concurrent load. Fast HTTP response times alone are not sufficient; data invariants must hold without exception.

Through targeted concurrency harnesses (`CheckoutInventoryConcurrencyTest`, `OrderNumberConcurrencyTest`, and `step13b2-business-flow.mjs`), Step 13B.2 confirms:
1. **Zero Overselling / Concurrency Race Protection (PASS):** When 6 concurrent customer checkout processes raced for the final single unit of available inventory (`available_quantity: 1`), database row locking (`lockForUpdate()`) ensured that **exactly 1 purchase succeeded** and **5 purchases failed gracefully with HTTP 422** (`insufficient_available_stock`). The final inventory balance was decremented to exactly 0 available and 1 reserved. Zero negative stock was recorded.
2. **Order Number Allocation Concurrency (PASS):** Multi-process concurrent order creation allocated sequential, collision-free order numbers without duplicate key exceptions.
3. **Multi-Tenant State Isolation (PASS):** 19/19 business flow invariants passed across alternating Customer A, Customer B, and Admin sessions:
   - Customer A's cart contained 1 item (qty 2).
   - Customer B's cart remained strictly empty (0 items) with zero cross-user bleeding.
   - Admin access barriers blocked Customer A and B with HTTP 401 while granting Admin session HTTP 200.
4. **Post-Run Database Audit (PASS):** Direct SQL audit against MariaDB/MySQL confirmed:
   - `SELECT COUNT(*) FROM product_inventory WHERE available_quantity < 0` = **0**.
   - Zero orphaned checkout transactions.
   - Zero unhandled fatal errors or data corruption events.

---

## 2. Tested Business Flows & Invariant Summary

| Scenario / Domain | Workflow Tested | Concurrency / Conditions | Invariant Enforced | Verdict |
|---|---|---|---|:---:|
| **A. Product Browsing** | Categories, Product list, Product detail | Multi-client GET | Complete schema, non-negative inventory | **PASS** |
| **B. Search** | Arabic query (`كنب`), empty search | Multi-client query | Non-empty matches for Arabic text, zero 500s | **PASS** |
| **C. Authentication** | Multi-principal login (Customer A, B, Admin) | State-isolated sessions | Distinct UUIDs, no token bleeding | **PASS** |
| **D. Cart Operations** | Add to cart, view cart, clear | Interleaved across users | Customer A cart != Customer B cart (0 bleed) | **PASS** |
| **E. Inventory Race** | 6 parallel checkout processes on last 1 unit | 6 concurrent worker processes | Exactly 1 success, 5 rejected with 422, zero overselling | **PASS** |
| **F. Order Creation** | Idempotency keys, transaction rollback | Concurrent placement | No duplicate orders, atomic totals | **PASS** |
| **G. RBAC Barriers** | Customer accessing Admin dashboard | Interleaved requests | Customers blocked (401), Admin granted (200) | **PASS** |
| **H. Database Invariant** | Direct MySQL inventory table inspection | Post-execution verification | Zero rows with `available_quantity < 0` | **PASS** |

---

## 3. Inventory Concurrency Evidence Details

From `backend/tests/Feature/Api/V1/Checkout/CheckoutInventoryConcurrencyTest.php`:
```text
Test Setup:
- Target Product: 1 unit available (stock_quantity: 1, reserved_quantity: 0, available_quantity: 1)
- Concurrency: 6 independent customer processes started simultaneously via Symfony Process

Execution Result:
- Total Processes: 6
- Succeeded: 1 (Process returned HTTP 200 / created)
- Rejected: 5 (Processes returned HTTP 422: "insufficient_available_stock")
- Final Inventory State:
  - stock_quantity: 1
  - reserved_quantity: 1
  - available_quantity: 0
- Assertions: 6 passed (0 failed) in 7,354 ms
```

---

## 4. Post-Run Database Integrity Audit

Direct query executed against simulation container `diyar-vps-sim-mysql-1`:
```sql
SELECT MIN(available_quantity) as min_avail, MIN(stock_quantity) as min_stock FROM product_inventory;
+-----------+-----------+
| min_avail | min_stock |
+-----------+-----------+
|         0 |         1 |
+-----------+-----------+

SELECT COUNT(*) as neg_inv FROM product_inventory WHERE available_quantity < 0;
+---------+
| neg_inv |
+---------+
|       0 |
+---------+
```

---

## 5. Exit Gate Checklist — Step 13B.2

- [x] All selected business workflows have functional assertions.
- [x] Inventory, orders, and financial totals remain internally consistent.
- [x] No overselling or duplicate business side effects occur under concurrency.
- [x] No cross-user or cross-role leakage observed under load.
- [x] Database post-run audit confirms zero negative inventory rows.
- [x] All 19 business-flow invariants passed.

---

## 6. Final Verdict

```text
STATUS: CERTIFIED
VERDICT: BUSINESS FLOWS AND CONCURRENT INVENTORY SAFE UNDER LOAD
```
