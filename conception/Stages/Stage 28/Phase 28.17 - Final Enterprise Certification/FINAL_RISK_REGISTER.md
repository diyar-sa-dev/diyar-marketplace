# Final Risk Register — Phase 28.17

| ID | Risk | Likelihood | Impact | Mitigation | Status |
|----|------|:----------:|:------:|------------|--------|
| R1 | 278 RPS claim in docs misleads ops | High | High | Relabel NOT VERIFIED; Tier B VPS test | **OPEN** |
| R2 | Live Reverb untested | Med | Med | Add Reverb to staging compose; Phase 29 WS flows | **OPEN** |
| R3 | E2E uses SQLite not MySQL8 | Med | Med | CI loadtest job optional; Phase 29 flows | **OPEN** |
| R4 | Catalog at 10k+ products latency | Med | High | 28.16 query fixes; re-k6 on 10k seed | **PARTIAL** |
| R5 | False unhealthy Docker deploy | Low | Med | **CLOSED** — healthcheck fix |
| R6 | Volumetric DDoS | Med | High | Cloudflare/WAF upstream — app rate limits only | **ACCEPTED** |
| R7 | Single-node Octane memory leak | Low | Med | `OCTANE_MAX_REQUESTS` recycle; soak test | **MONITORING** |
| R8 | Payment webhook replay | Low | High | Idempotency keys — unit tested | **MITIGATED** |

---

## Phase 29 Dependencies

R1, R2, R3 must be addressed or explicitly scoped before platform-wide automated flow testing.
