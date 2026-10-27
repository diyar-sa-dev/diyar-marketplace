# SHIPPING_V2_WORKFLOW.md

## Autonomous Execution Rules for Shipping V2

This document defines the operating rules and review standards for all Shipping V2 batches (`S2-00` to `S2-10`).

---

## 1. The Three Mandatory Review Faces

Every batch must undergo review across three distinct engineering faces:

### Face 1: Principal Software Engineer
- **Responsibility:** Domain modeling, DDD boundaries, Laravel patterns, code cleanliness, strict typing, and maintainability.
- **Workflow:**
  1. Inspect affected call paths and domain services.
  2. Implement minimal, additive changes.
  3. Re-verify callers and check backward compatibility.
  4. Ensure zero regressions against V1 manual shipping flows.

### Face 2: QA / DevOps / Performance Engineer
- **Responsibility:** Test verification, failure simulation, timeout handling, retry policies, database query counts, and idempotency.
- **Workflow:**
  1. Test both happy paths and edge cases (timeouts, 500 errors, network partitions).
  2. Ensure external API calls are decoupled from synchronous customer requests.
  3. Verify database locks (`lockForUpdate`) prevent concurrent state corruptions.
  4. Run relevant automated test suites and document exact commands and outcomes.

### Face 3: Security & Bug Bounty Engineer
- **Responsibility:** Threat modeling, authorization bypass checks, object-level access controls, credential security, and webhook tampering.
- **Workflow:**
  1. Verify RBAC policies (`VendorOrderPolicy`, `admin.permission`).
  2. Ensure zero plaintext secrets in database tables or logs.
  3. Validate HMAC signatures and replay protection on webhook endpoints.
  4. Verify label download routes prevent unauthorized direct access.

---

## 2. Batch Progression Protocol

1. **Start Batch:** Update `.agent/CURRENT_STATE_SHIPPING_V2.md` to set batch status to `IN_PROGRESS`.
2. **Execute Tasks:** Work strictly within the batch's defined scope.
3. **Three-Face Review:** Complete the three review passes and record findings in the batch `REPORT.md`.
4. **Run Tests:** Execute non-destructive automated test suites and capture exact outputs.
5. **Close Batch:** Mark batch as `COMPLETE` in `.agent/CURRENT_STATE_SHIPPING_V2.md` and transition to the next batch.
