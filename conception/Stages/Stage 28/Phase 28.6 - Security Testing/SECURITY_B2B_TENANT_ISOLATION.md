# Phase 28.6 — B2B Tenant Isolation

**Tests:** `B2bCompanyTest`, `PartnerB2bCompanyTest`, `PartnerB2bLeadTest`, `AdminB2bCompanyTest`

---

## Public vs draft

| Check | Result |
|-------|--------|
| Draft company public GET | **404** |
| Admin draft filter | Visible to admin only |
| Publish/unpublish | Admin permission gated |

---

## Partner (vendor) scope

| Test | Result |
|------|--------|
| Vendor manages own B2B company | **PASS** |
| Vendor cannot manage another vendor's company | **403** |
| Customer cannot access partner B2B management | **403** |

---

## Lead isolation

| Test | Result |
|------|--------|
| Customer cannot view another user's lead | **403** |
| RFQ submission requires auth | **401** guest |

---

## Cross-tenant analytics / counts

Explicit inference attacks (Tenant A listing Tenant B counts): **NOT VERIFIED** in dedicated tests.

---

## Gate

```text
PARTIAL
```

Core B2B ownership tests pass; exhaustive tenant inference matrix **NOT VERIFIED**.
