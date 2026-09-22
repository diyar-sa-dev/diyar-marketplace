# Phase 18 — PHP/Octane CPU profiling methodology

## Objective

Measure where CPU time goes at the **KVM2-equivalent rps150 mixed boundary** on the **Phase 17 optimized** working tree (01b + 01c; no 01a). **No speculative application optimizations** until hotspots are evidenced.

## Envelope (must match Phase 15/17)

| Constraint | Value |
|------------|--------|
| Docker | Linux engine, project `diyar-kvm2-test` |
| App CPU | cpuset **0–1** |
| k6 CPU | cpuset **2–3** |
| Octane workers | **2** (`OCTANE_WORKERS=2`) |
| Rate limits | ON |
| Dataset | ~12 public products (unchanged) |
| Hostinger | **NOT VERIFIED** |

## Workloads (existing scripts)

| Class | k6 script | PROFILE / WORKLOAD |
|-------|-----------|-------------------|
| Guest detail | `kvm2-phase15-diagnostics.js` | `detail-guest` (25 VU) |
| Guest detail 50 VU | `kvm2-phase2-diagnostics.js` | `vu50` + `WORKLOAD=detail` |
| Auth detail | `kvm2-phase15-diagnostics.js` | `detail-auth`, `detail-auth-vu50` |
| Search | `kvm2-phase2-diagnostics.js` | `vu25`/`vu50`/`rps100`/`rps150` + `WORKLOAD=search` |
| Listing | `kvm2-phase2-diagnostics.js` | `vu25`/`vu50`/`rps100`/`rps150` + `WORKLOAD=products` |
| Mixed realistic | `kvm2-phase15-diagnostics.js` | `mix-realistic` |
| Mixed rate | `kvm2-phase2-diagnostics.js` | `rps100`–`rps200`, `WORKLOAD=mixed` |

## Repeatability

- **rps125, rps150, rps200:** minimum **3 replicates** each (same code, no changes between replicates).
- Record k6 summary JSON + optional `kvm2-phase2-sampler.ps1` JSONL (≥1 sample/sec during rps150).

## Profiling priority

1. **Primary:** steady-state **rps150 mixed** (Phase 15/17 capacity boundary).
2. **Secondary:** rps100, rps125, rps200; isolated search at rps150 if mix implicates catalog path.

## Profiler

1. **Preferred:** [php-spx](https://github.com/NoiseByNorthwest/php-spx) (low overhead). Enabled only during profiling runs; not left on for certification defaults.
2. **Not primary:** Xdebug (distorts high-load timing).
3. **Supporting:** Docker `stats` sampler (container CPU %), Redis `INFO`, MySQL `SHOW GLOBAL STATUS` — **not** PHP function-level proof.

## Evidence layout

```text
phase18-php-cpu-profiling/
  environment/          runtime inspect + cert JSON
  baseline/             single-run summaries per profile class
  rps125|rps150|rps200/ 3× replicates + statistics
  cpu-samples/          sampler JSONL
  profiling/            SPX reports or limitation notes
  face2/                adversarial review
  final/                campaign.json
```

## Invalid evidence (do not use)

- Phase 17.2 **git HEAD control** paired runs with mass **5xx** — not quantitative A/B.
