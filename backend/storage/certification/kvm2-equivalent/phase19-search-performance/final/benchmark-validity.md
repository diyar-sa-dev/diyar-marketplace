# Benchmark validity — Phase 19 deep verification

## k6 VU ceiling

During **rps175** baseline run, k6 logged:

```text
Insufficient VUs, reached 320 active VUs and cannot initialize more
```

The prior `rps175` profile used `maxVUs: 320`. When the executor cannot allocate VUs, **achieved RPS and latency mix application behavior with k6 scheduling artifact**.

**Mitigation (harness):** `maxVUs` raised to **400** (rps175) and **450** (rps200) in `kvm2-phase2-diagnostics.js`. Re-runs after baseline completes should be compared cautiously.

## Warm-up / cache state

Phase 19 baseline **run 1** at rps125 showed **p95 254 ms / search_p95 405 ms** while runs 2–3 were **~39–48 ms**. Prior activity included `cache:clear` during traffic matrix and decomposition.

**Classification:** first replicate after cache flush is **not comparable** to steady-state without explicit warm-up stage.

## XFF rate-limit spread

k6 `apiParams()` rotates `X-Forwarded-For` per VU — limits are **not** the dominant 429 source (0× 429 in campaigns).

## sleep() in default function

`sleep(0.15–0.4)` reduces offered load vs nominal RPS — by design from Phase 2; compare only across runs using the same script.

## Host environment

Docker Desktop on Windows — CPU scheduling noise possible; cpuset **0–1** for app verified.
