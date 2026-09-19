# KVM2 pre-deploy — Octane + k6 (Grafana dashboard)

**Date:** 2026-09-16  
**Stack:** `diyar-production` with `docker-compose.production.octane.yml` (Swoole, **2 workers**), nginx `:8093`, MySQL, Redis, queue workers, Reverb.  
**Frontend:** local Vite `npm run dev` `:3000` (production API proxy → `:8093`; Vercel stand-in).  
**Load tool:** Grafana `k6` + web dashboard (`K6_WEB_DASHBOARD`, `:5665` during runs).

> **Proxy measurement** on a Windows dev machine (11.7 GiB RAM). Hostinger **KVM2 (2 vCPU / 8 GB)** will differ; use this for **relative** capacity and regressions before deploy.

---

## Executive verdict

| Tier | Verdict |
|------|---------|
| **10 users / 10 RPS** | **PASS** — search p95 ~11–13 ms, 0% API errors |
| **100 users / ~100 RPS** | **PASS** — search p95 ~400 ms, 0% API errors, ~260 RPS achieved |
| **1,000 users / 1k RPS target** | **DEGRADED** — 0% 5xx/429 on Octane metrics, but search p95 **~2.7 s** (VU) / **~4.8 s** (1k RPS) |
| **10,000 users / 10k RPS** | **FAIL** — connection **EOF**, **57–94%** failed requests; not a KVM2 production target |

**Recommended KVM2 storefront API budget (Octane, 2 workers, search-heavy):**

- **Sustained:** ~**100–150 RPS** (~6k–9k RPM) with search p95 **< 500 ms**
- **Burst (same-time):** ~**100 concurrent** requests without error
- **Do not plan** for 1k+ sustained RPS or 10k VUs on KVM2 without **KVM4**, more Octane workers/nodes, or CDN/edge caching

---

## Results matrix (Octane API via nginx)

| Profile | Mode | Peak VUs | RPS | RPM | p95 (ms) | Search p95 (ms) | Error % | 429 | 5xx |
|---------|------|----------|-----|-----|----------|-----------------|---------|-----|-----|
| vu10 | 10 users | 10 | 39.8 | 2,389 | 14 | 13 | 0 | 0 | 0 |
| burst10 | 10 same-time | — | 148 | 8,883 | 62 | 62 | 0 | 0 | 0 |
| rps10 | 10 RPS cap | 20 | 16.9 | 1,016 | 10 | 11 | 0 | 0 | 0 |
| vu100 | 100 users | 100 | 260.6 | 15,635 | 424 | 400 | 0 | 0 | 0 |
| burst100 | 100 same-time | — | 246.5 | 14,790 | 355 | 355 | 0 | 0 | 0 |
| rps100 | 100 RPS cap | 130 | 169.2 | 10,149 | 214 | 207 | 0 | 0 | 0 |
| vu1000 | 1,000 users | 1,000 | 347.7 | 20,859 | 2,666 | 2,667 | 0 | 0 | 0 |
| burst1000 | 1k same-time | 1,000 | 300.3 | 18,016 | 3,002 | 3,002 | 0 | 0 | 0 |
| rps1000 | 1k RPS cap | 1,200 | 314.8 | 18,886 | 4,833 | 4,837 | 0 | 0 | 0 |
| vu10000 | 10k users (aborted) | 3,461 | 729 | 43,746 | 4,144 | 4,147 | **56.9** | 0 | 0 |
| burst10000 | 10k same-time | 10,000 | 1,028 | 61,692 | 5,806 | 5,806 | **74.9** | 0 | 0 |
| rps10000 | 10k RPS cap | 3,348 | 2,458 | 147,497 | 1,019 | 2,557 | **94.0** | 0 | 0 |

Raw JSON: `backend/storage/certification/k6/summary-*.json`, rollup `campaign.json`.  
Grafana export: `backend/storage/certification/k6/dashboard.html` (last run).

---

## Infrastructure notes

- **Octane fix:** removed invalid `/dev/null` volume mount from `docker-compose.production.octane.yml` (was preventing app start on Windows Docker).
- **Workers:** `OCTANE_WORKERS=2` matches KVM2 vCPU budget.
- **Post-load container RAM (idle):** app ~161 MiB, MySQL ~465 MiB, Redis ~28 MiB, queues ~35 MiB each.
- **Vite:** not load-tested from k6 container (`HIT_FRONTEND=0` by default); browser dev server is **not** production CDN — API numbers are what matter for KVM2.

---

## Re-run

```powershell
# Terminal 1 — frontend (Vercel stand-in)
cd frontend; npm run dev

# Terminal 2 — full campaign (Octane switch + Grafana dashboard on :5665)
.\scripts\performance\run-octane-predeploy.ps1 -IncludeHigh

# Resume after partial run
.\scripts\performance\run-octane-predeploy.ps1 -SkipOctaneSwitch -SkipExisting -IncludeHigh
```

Switch back to PHP-FPM production profile when done benchmarking:

```powershell
docker compose -f docker-compose.production.yml --env-file deploy/docker/production.env up -d --build app nginx
```

---

## QA / DevOps checklist before KVM2 deploy

- [ ] Confirm **FPM vs Octane** runtime choice on VPS (Octane for API throughput; FPM if long-running requests dominate).
- [ ] Set `OCTANE_WORKERS=2` on KVM2; revisit on KVM4.
- [ ] Keep **Vercel** for static frontend; API only on VPS.
- [ ] Rate limits **on** in production (`DIYAR_LOADTEST_MODE=false`).
- [ ] Re-run **vu100 + rps100** on the **actual VPS** and compare p95 to this proxy report.
