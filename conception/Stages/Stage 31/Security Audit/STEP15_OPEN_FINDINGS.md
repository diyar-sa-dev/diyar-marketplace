# DIYAR — STEP 15 OPEN FINDINGS & OPERATIONAL RISK REGISTER
# VULNERABILITY STATUS, REMEDIATION TRACKING & PRODUCTION LIMITATIONS

**Document Type:** Authoritative Security Risk Register & Open Findings Log  
**Phase:** Modular Monolith Architecture — Step 15 Reconciliation  
**Date:** 2026-10-10  
**Authority:** Principal Application Security Engineer, DevSecOps Lead  
**Scope:** Full-Stack Codebase, Configuration, AI Providers, Infrastructure Boundary  

---

## 1. Vulnerability Findings Summary

| Finding ID | Severity | Category | Title / Component | Attack Vector / Scenario | Status | Remediation & Evidence |
|---|:---:|---|---|---|:---:|---|
| **SEC-01** | Low | Resilience / Error Handling | Guest Cart Session Store Uncaught Exception (`/api/v1/cart`) | Calling cart from non-browser stateless client triggers unhandled `RuntimeException` (HTTP 500) due to unattached Sanctum session store. | **RESOLVED & VERIFIED** | Guarded with `$request->hasSession()`; supports `X-Guest-Cart-Token` or returns standardized `HTTP 401 Unauthorized`. Verified in `CartSessionlessRequestTest.php` (PASS: 2 tests, 10 assertions). |
| **SEC-02** | Informational | Authorization / Privacy | Room Designer AI Legal Privacy Gate | User photos could theoretically be transmitted to external OpenAI image API without documented regulatory compliance. | **CONTROL VERIFIED** | Hardcoded fail-closed legal gate (`legal_privacy_gate_closed`) in `VisualizationService.php`. Blocks all external HTTP calls while legal approval is pending. Verified in `OpenAiLegalGateIntegrationTest.php` (PASS). |
| **SEC-03** | Informational | Integrity / Idempotency | Guest Cart Token Entropy Assurance | If a headless API client transmits a predictable or sequential guest token, cart collisions could theoretically occur. | **DOCUMENTED ONLY** | Mobile/headless clients must generate standard RFC 4122 v4 UUIDs (128-bit entropy). Server isolates each token into unique `session_id` database records. |
| **SEC-04** | Informational | Operational / Benchmark | Local Docker Offline during Verification | Docker Desktop engine offline on local workstation during current evidence reconciliation session. | **OPERATIONAL LIMITATION** | Local benchmark execution is marked `NOT RUN (Docker offline)`. Performance baseline references Step 13B.1–13B.3 container benchmark logs (280–320 RPS, <60ms p95). Live Hostinger VPS remains untouched. |
| **SEC-05** | Informational | Operational / E2E | Full Playwright E2E Test Suite | Full multi-browser end-to-end suite requires active live containers and headless browser drivers. | **OPERATIONAL LIMITATION** | E2E suite marked `NOT RUN in Current Session`; unit and feature regression suites (PHPUnit 1,103 tests, Vitest 350 tests) executed and 100% green. |

---

## 2. Detailed Severity Breakdown

```text
================================================================================
                    FINDING SEVERITY METRICS
================================================================================
Critical Findings:           0 (None Identified)
High Findings:               0 (None Identified)
Medium Findings:             0 (None Identified)
Low Findings (Open):         0 (1 Identified, 1 Resolved & Verified)
Informational / Operational: 4 (Documented & Assessed)
--------------------------------------------------------------------------------
TOTAL BLOCKING VULNERABILITIES: 0
================================================================================
```

---

## 3. Residual Operational Risk Assessment

### 3.1 Live Production Environment Divergence
- **Risk:** Local SQLite/MySQL testing in local simulation cannot measure real external internet latency, CDN routing (Cloudflare/Hostinger edge), or production SSL handshake overhead.
- **Mitigation:** Comprehensive staging smoke-test checklist prepared in `deploy/runbooks/` to execute upon live VPS provisioning.

### 3.2 External AI Driver Activation
- **Risk:** Once `AI_VISUALIZATION_LEGAL_APPROVAL.md` is approved and the legal gate opens, OpenAI API failures or quota exhaustion could occur.
- **Mitigation:** `VisualizationService` incorporates an automated circuit breaker (5 failures within 300s halts requests for 300s) and daily per-user quotas (50 requests/day).

---

## 4. Final Finding Certification

All discovered vulnerabilities across the 528 API routes have been resolved or mitigated. Zero Critical, High, or Medium security defects remain open.
