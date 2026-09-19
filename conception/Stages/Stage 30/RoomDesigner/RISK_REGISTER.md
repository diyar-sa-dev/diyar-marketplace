# Risk Register

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

| ID | Risk | Likelihood | Impact | Mitigation | Status |
|----|------|------------|--------|------------|--------|
| R1 | Fabric bundle bloat hurts TTI | Med | High | Lazy load; measure in 30.4; Konva fallback | **PREPARED** |
| R2 | KVM2 saturation when designer saves + peak traffic | Med | High | Debounce; rate limits; stay <56 RPS mixed budget | **PREPARED** |
| R3 | Missing Tier-1 assets for most SKUs | High | Med | Footprint fallback | **PREPARED** |
| R4 | AI cost overrun | Med | High | Quotas, circuit breaker, flags off default | **PREPARED** |
| R5 | Version conflict data loss | Low | High | 409 + local retain | **PREPARED** |
| R6 | Mobile gesture conflicts | Med | Med | Dedicated rotate control | **PREPARED** |
| R7 | IDOR on designs | Low | Critical | Policies + tests | **PREPARED** |
| R8 | Document schema drift | Med | Med | schema_version + migrators | **PREPARED** |
| R9 | Catalog API N+1 from designer | Med | Med | Query cache; batch | **PREPARED** |
| R10 | Hostinger ≠ local kvm2 metrics | High | Med | Re-test on VPS when access fixed | **NOT VERIFIED** |
| R11 | Privacy/legal for room photos | Med | High | Block GA until policy updated | **BLOCKED** |
| R12 | Prototype px/% debt reintroduced | Med | High | Code review gate; domain tests | **PREPARED** |
