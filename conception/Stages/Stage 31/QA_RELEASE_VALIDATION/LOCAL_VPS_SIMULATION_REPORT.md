# DIYAR V1 — LOCAL VPS SIMULATION REPORT (PHASE 7)

> **Document Status:** VERIFIED EMPIRICAL VALIDATION  
> **Execution Date:** 2026-10-11  
> **Execution Role:** DevOps & Release Validation Engineer  
> **Target Release:** DIYAR V1 Release Candidate  

---

## 1. Architecture & Topology Overview

The desktop development host executes a high-fidelity local VPS production simulation stack via [docker-compose.production-like.yml](file:///c:/Users/APL%20TECH/OneDrive/Documents/Web/Work/Hamid/project/diyar-marketplace/docker-compose.production-like.yml), replicating the resource constraints and service topology of the target **Hostinger KVM 2 VPS** (4 vCPU, 16 GB RAM, Ubuntu/Docker runtime):

```text
[ Browser / Client ]
         │
         ▼
[ Nginx Gateway :8092 ] ─── Static SPA Files ───> [/frontend/dist]
         │
         ├─── FastCGI :9000 ───> [ PHP 8.3 FPM Pool (app) ]
         │                               │
         │                               ├─── Database: [ MySQL 8.0 ] (:3306)
         │                               └─── Cache/Queue/Sessions: [ Redis 7 ] (:6379)
         │
         ├─── Websockets :8090 ───> [ Laravel Reverb ]
         │
[ Background Daemons ]
         ├─── Queue Worker: [ php artisan queue:work redis ]
         └─── Cron Scheduler: [ php artisan schedule:run ]
```

---

## 2. Service Health & Connectivity Evidence

The simulation stack was launched and verified directly via Docker and HTTP probes.

### 2.1 Container Status Table

| Container Name | Service | Image | Status | Ports |
| :--- | :--- | :--- | :---: | :--- |
| `diyar-vps-sim-mysql-1` | Database | `mysql:8.0` | **Up (healthy)** | Internal :3306 |
| `diyar-vps-sim-redis-1` | Cache/Queue | `redis:7-alpine` | **Up (healthy)** | Internal :6379 |
| `diyar-vps-sim-app-1` | PHP Runtime | `Dockerfile.fpm` (PHP 8.3) | **Up (healthy)** | Internal :9000 |
| `diyar-vps-sim-reverb-1` | Realtime WS | `Dockerfile.fpm` (Reverb) | **Up** | Internal :8090 |
| `diyar-vps-sim-queue-worker-1` | Queue Worker | `Dockerfile.fpm` | **Up** | Background |
| `diyar-vps-sim-scheduler-1` | Task Scheduler | `Dockerfile.fpm` | **Up** | Background |
| `diyar-vps-sim-nginx-1` | Gateway Proxy | `nginx:1.27-alpine` | **Up** | **Host :8092 -> Container :80** |

### 2.2 Live Health Endpoint Verification

**Probe:** `GET http://127.0.0.1:8092/api/v1/health`  
**HTTP Status:** `200 OK`  
**Payload Evidence:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "diyar-api",
    "version": "1.0.0-stage26",
    "checks": {
      "database": {
        "ok": true,
        "driver": "mysql"
      },
      "cache": {
        "ok": true,
        "driver": "redis"
      },
      "queue": {
        "ok": true,
        "driver": "redis",
        "pending_jobs": 0,
        "failed_jobs": 0
      },
      "payments": {
        "ok": true,
        "status": "ok",
        "metrics": {
          "provider": "fake",
          "fake_gateway": true,
          "stuck_submitted_payments": 0,
          "pending_webhook_events": 0,
          "failed_webhook_events_24h": 0,
          "unknown_payments": 0
        }
      }
    },
    "maintenance": {
      "marketplace_enabled": false
    }
  }
}
```

---

## 3. Comparison with Laptop Environment (`diyar-lap`)

| Aspect | Desktop VPS Simulation (`diyar-dev`) | Laptop Dev (`diyar-lap`) | Hostinger Production VPS |
| :--- | :--- | :--- | :--- |
| **Runtime Topology** | Multi-container Docker Compose | Bare-metal PHP-FPM + XAMPP | Dockerized / Managed VPS |
| **Database** | Containerized MySQL 8.0 (`diyar_vps_simulation`) | Local MariaDB/MySQL | Production MySQL 8.0 |
| **Caching & Queues**| Dedicated Redis 7 container | File / Array cache (no Redis) | Production Redis 7 |
| **Web Server** | Nginx reverse proxy on `:8092` | Apache (`httpd`) on `:8080` | Nginx reverse proxy with SSL |
| **Suitability** | High-fidelity deployment rehearsal | Manual local acceptance testing | Live customer traffic |

---

## 4. VPS Simulation Conclusion

The local VPS simulation stack is **100% OPERATIONAL**. All container health checks pass, Redis queue/cache connections are verified, and the Nginx reverse proxy routes traffic properly between the built React SPA and the PHP-FPM backend.
