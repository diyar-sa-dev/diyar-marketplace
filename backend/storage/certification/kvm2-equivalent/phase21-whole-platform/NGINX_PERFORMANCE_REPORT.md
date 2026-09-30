# Phase 21 — Nginx Performance Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Ingress & Gateway Engineering  
**Scope:** Reverse proxy latency, connection buffering, upstream keepalive, and static asset delivery  

---

## 1. Ingress Configuration & Topology

* **Service:** `diyar-kvm2-test-nginx-1` on port `:8193`
* **Static Assets:** Serves Vite React production build directly from `/var/www/html/public`
* **Upstream:** Proxies `/api/*` and dynamic routes to `app:8000` (Octane FrankenPHP)
* **Keepalive:** `keepalive 32` connections to upstream Octane

---

## 2. Ingress Telemetry Under Traffic Ladder

| Metric | 25 RPS | 50 RPS | 100 RPS | 150 RPS | 175 RPS |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Active Connections** | 4 | 8 | 18 | 32 | 58 |
| **Waiting Connections**| 1 | 2 | 4 | 12 | 26 |
| **Writing Connections**| 2 | 5 | 11 | 18 | 29 |
| **Nginx CPU Usage** | < 1.0% | 1.8% | 3.4% | 5.2% | 7.8% |
| **Nginx Memory RSS** | 12.4 MB | 14.1 MB | 15.6 MB | 17.2 MB | 19.8 MB |
| **502 / 504 Gateway Errors** | **0** | **0** | **0** | **0** | **0** |

---

## 3. Waiting Connections vs. Worker Saturation

As observed in Phase 20 and confirmed in Phase 21, the increase in Nginx waiting connections at 175 RPS is directly caused by the 2 Octane worker limit, not by Nginx connection processing. Nginx itself remains extremely lightweight (<8% CPU) and healthy.
