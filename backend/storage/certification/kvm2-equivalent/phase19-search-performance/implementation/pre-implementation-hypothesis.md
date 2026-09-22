# Pre-implementation hypothesis — Phase 19

## Problem

Post-18.3, mixed/search saturation still rises ~125–200 RPS with search sub-metrics often highest.

## Evidence (pre-baseline)

| Observation | Source |
|-------------|--------|
| Warm `q=sofa&type=all` **0.63 ms**, **0 SQL** | `search/decomposition.json` |
| Warm `no_q` **0.88 ms**, **0 SQL**, **~20 KB JSON** | same |
| Cold `no_q` **44.7 ms**, **19 SQL** | same |
| k6 search-only rps150 **p95 ~143 ms** | Phase 18.3 |
| **12** publicly visible products | `environment/environment-cert.json` |

## Root cause (Face 3)

**Primary:** Octane worker / application CPU **occupancy and queueing** under offered load — **not** warm-path catalog SQL for q-bearing k6 traffic.

**Secondary (different path):** Empty-query catalog browse pays **heavy facet SQL** on cache miss — relevant to storefront `/catalog/search` without `q`, not k6 q-rotation.

## Confidence

| Claim | Level |
|-------|-------|
| Warm q-search is cache-fast on tiny dataset | **HIGH** |
| Saturation is worker/CPU envelope | **MEDIUM** (pending Phase 19 CPU samples) |
| Facet SQL is dominant on no_q cold | **HIGH** |

## Proposed change

**NONE — optimization rejected at decision gate.**

Reason: No single safe application change is expected to move rps150 search p95 materially when warm microbenchmark is sub-millisecond.

## Risks if we optimized anyway

False success from variance; moving CPU to Redis locks; breaking API contracts; masking envelope limits.

## Benchmark for any future change

Phase 19 baseline ladder + CPU sampler + search decomposition cold/warm matrix.
