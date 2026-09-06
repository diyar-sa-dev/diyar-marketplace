# DIYAR — Complete Production Deployment & Certification Master Plan

## Overall lifecycle

```text
PHASE 0
Architecture & Production Planning
        │
        ▼
PHASE 1
VPS Foundation & Security
        │
        ▼
PHASE 2
Docker Runtime
        │
        ▼
PHASE 3
Docker Host Hardening
        │
        ▼
PHASE 4
Production Filesystem / Secrets / Config
        │
        ▼
PHASE 5
Database
        │
        ▼
PHASE 6
Redis
        │
        ▼
PHASE 7
Laravel Backend
        │
        ▼
PHASE 8
Frontend
        │
        ▼
PHASE 9
Nginx Gateway
        │
        ▼
PHASE 10
DNS
        │
        ▼
PHASE 11
TLS / HTTPS
        │
        ▼
PHASE 12
Laravel Production Configuration
        │
        ├──────────────┐
        ▼              ▼
PHASE 13             PHASE 14
Queues               Scheduler
        │              │
        └──────┬───────┘
               ▼
          PHASE 15
       Reverb / WebSockets
               │
               ▼
          PHASE 16
     Storage & Permissions
               │
               ▼
          PHASE 17
 External Services / Mail / Notifications
               │
               ▼
          PHASE 18
 Payments & Webhooks
               │
               ▼
          PHASE 19
 Application Security
               │
               ▼
          PHASE 20
 Backup & Recovery
               │
               ▼
          PHASE 21
 Logging & Observability
               │
               ▼
          PHASE 22
 Monitoring & Health Checks
               │
               ▼
          PHASE 23
 Deployment / Rollback
               │
               ▼
          PHASE 24
 CI/CD
               │
               ▼
          PHASE 25
 Production Data Migration
               │
               ▼
          PHASE 26
 Production Smoke / E2E
               │
               ▼
          PHASE 27
 Security Audit
               │
               ▼
          PHASE 28
 Performance / Load
               │
               ▼
          PHASE 29
 Concurrency / Runtime Scale
               │
               ▼
          PHASE 30
 Failure / Disaster Recovery
               │
               ▼
          PHASE 31
 Production Readiness Review
               │
               ▼
          PHASE 32
 GO-LIVE
               │
               ▼
          PHASE 33
 Post-Go-Live Stabilization
               │
               ▼
          PHASE 34
 FINAL CERTIFICATION
```

---

# PHASE 0 — Architecture & Production Planning

### Objective

Define exactly **what we are deploying and how the VPS will run it** before installing anything.

### We will do

* Confirm production architecture.
* Confirm Docker Compose architecture.
* Define services.
* Define networks.
* Define volumes.
* Define environment configuration.
* Define secrets strategy.
* Define public/private ports.
* Define resource limits.
* Define startup dependencies.
* Define health checks.
* Define deployment order.
* Define rollback strategy.
* Define backup strategy.
* Define domain/subdomain architecture.
* Define TLS architecture.
* Decide initial runtime: **PHP-FPM rather than Octane**.
* Define where Reverb runs.
* Define queue worker architecture.
* Define scheduler architecture.
* Define database architecture.
* Define Redis architecture.

### Expected architecture

```text
                         INTERNET
                            │
                     80 / 443 only
                            │
                            ▼
                         NGINX
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        Frontend       Laravel API      Reverb
             │              │              │
             └──────────────┼──────────────┘
                            │
                  PRIVATE DOCKER NETWORK
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
           Redis                       Database
              │
              ▼
        Queue Workers
              │
              ▼
          Scheduler
```

### Exit gate

**PASS only when the architecture is documented and every service has a defined purpose.**

---

# PHASE 1 — VPS Foundation & Security

### Objective

Secure the operating system before installing application infrastructure.

### Completed

* Ubuntu updates.
* `deploy` administrator.
* SSH key authentication.
* Root SSH disabled.
* SSH password authentication disabled.
* SSH configuration validation.
* UFW.
* IPv4 firewall.
* IPv6 firewall.
* Fail2Ban.
* nftables enforcement test.
* unattended security updates.
* 2 GB swap.
* swap persistence.
* GPT verification.
* filesystem verification.
* DNS.
* NTP.
* routing.
* listening-port audit.
* systemd failure audit.
* Hostinger snapshot.

### Exit gate

**PASS ✅**

This is our current position.

---

# PHASE 2 — Docker Engine & Container Runtime

### Objective

Install Docker cleanly without yet deploying DIYAR.

### We will do

* Determine supported Docker repository/package path.
* Install Docker Engine.
* Install Docker Compose plugin.
* Verify versions.
* Verify daemon.
* Verify Docker socket.
* Test container lifecycle.
* Test Compose.
* Test networking.
* Test volume creation.
* Test restart behavior.
* Verify Docker starts after reboot.
* Verify `deploy` access to Docker safely.
* Verify Docker does not expose unwanted ports.

### Important

We will **not** immediately run the DIYAR stack.

### Exit gate

```text
Docker daemon        PASS
Compose              PASS
Container lifecycle  PASS
Networking           PASS
Persistence          PASS
Restart              PASS
Security             PASS
```

---

# PHASE 3 — Docker Host Security & Resource Controls

### Objective

Make the Docker host production-safe.

### We will do

* Review Docker daemon configuration.
* Review Docker socket permissions.
* Configure container log rotation.
* Prevent unlimited container logs.
* Establish CPU/memory expectations.
* Review PID/resource behavior.
* Review Docker bridge networking.
* Confirm public port exposure.
* Ensure DB/Redis aren't published publicly.
* Review Docker's interaction with UFW.
* Establish container restart policies.
* Establish health-check requirements.
* Review filesystem mounts.
* Review privileged containers.
* Ensure no unnecessary `privileged: true`.
* Ensure no unnecessary host networking.
* Ensure no unnecessary host mounts.

### Exit gate

No container gets more privilege than required.

---

# PHASE 4 — Production Filesystem, Configuration & Secrets

### Objective

Create the production filesystem structure before application deployment.

### We will create

For example:

```text
/opt/diyar/
├── compose/
├── app/
├── nginx/
├── scripts/
├── backups/
├── shared/
├── logs/
└── secrets/
```

Exact structure will be finalized during this phase.

### We will define

* `.env` strategy.
* Secret ownership.
* File permissions.
* Docker secrets/environment strategy.
* Production configuration.
* Persistent volumes.
* Upload storage.
* Backup directories.
* Deployment directories.
* Release/version structure.

### Security

Secrets must never be:

* committed to Git;
* placed in public web directories;
* printed unnecessarily in logs;
* included in Docker images.

### Exit gate

All persistent data and secrets have defined ownership, permissions, and backup behavior.

---

# PHASE 5 — Database Infrastructure

### Objective

Deploy production database infrastructure.

### We will do

* Choose exact database engine/version compatible with DIYAR.
* Create database container.
* Create persistent volume.
* Create dedicated database.
* Create dedicated application user.
* Avoid root/superuser application access.
* Configure authentication.
* Configure charset/collation.
* Configure timezone expectations.
* Configure resource limits.
* Configure health check.
* Configure restart policy.
* Test persistence.
* Test backup.
* Test restore.
* Test connection from Laravel.
* Verify database is **not publicly exposed**.

### Exit gate

Database survives container restart and can be backed up/restored.

---

# PHASE 6 — Redis Infrastructure

### Objective

Deploy Redis correctly for DIYAR's cache/queue/session/runtime needs.

### We will determine

Exactly which Redis roles DIYAR uses:

```text
Redis
├── Cache
├── Queue
├── Session
└── Realtime/supporting state
```

### We will do

* Redis container.
* Persistent configuration where appropriate.
* Authentication.
* Memory policy.
* Memory limits.
* Health check.
* Network isolation.
* Connection testing.
* Laravel integration.
* Queue integration.
* Cache integration.
* Failure/restart testing.

### Exit gate

Redis is private and Laravel can correctly use every required Redis function.

---

# PHASE 7 — Laravel Backend

### Objective

Deploy the actual Laravel production application.

### We will do

* Build production image.
* PHP version verification.
* Composer production dependencies.
* Disable development dependencies.
* `APP_ENV=production`.
* `APP_DEBUG=false`.
* Application key.
* Database configuration.
* Redis configuration.
* Cache configuration.
* Session configuration.
* Queue configuration.
* Storage configuration.
* Logging configuration.
* Trusted proxies.
* URL configuration.
* CORS.
* Sanctum.
* production `.env`.
* migrations.
* application cache.
* route cache.
* config cache.
* view cache.

### We will verify

```text
Laravel boots
Database works
Redis works
Authentication works
Storage works
API works
Error handling works
```

---

# PHASE 8 — Frontend

### Objective

Build and serve the React production frontend.

### We will do

* Install dependencies.
* Production build.
* Environment variables.
* API URL.
* WebSocket configuration.
* Asset generation.
* Static asset validation.
* SPA routing.
* Cache headers.
* Compression.
* Build reproducibility.
* Remove development artifacts.

### Exit gate

Frontend communicates with production API correctly.

---

# PHASE 9 — Nginx Gateway

### Objective

Create the only application-facing public gateway.

### Public architecture

```text
Internet
   │
   ├── :80
   └── :443
        │
        ▼
      Nginx
        │
        ├── React
        ├── Laravel API
        └── Reverb
```

### We will configure

* HTTP.
* HTTPS preparation.
* Reverse proxy.
* FastCGI.
* Static assets.
* WebSocket proxy.
* Request size.
* timeouts.
* buffering.
* security headers.
* rate-control considerations.
* access logs.
* error logs.
* hidden files.
* sensitive paths.
* health endpoints.

### Exit gate

Only Nginx is public.

---

# PHASE 10 — DNS

### Objective

Connect the real domain to the VPS.

### We will configure

* A/AAAA records.
* API subdomain if required.
* WebSocket subdomain if required.
* DNS TTL strategy.
* IPv4.
* IPv6.
* DNS propagation verification.

We will **not blindly create AAAA records** if the application's IPv6 setup isn't ready.

---

# PHASE 11 — TLS / HTTPS

### Objective

Secure all public HTTP traffic.

### We will do

* Let's Encrypt/ACME.
* Certificate issuance.
* Nginx HTTPS.
* HTTP → HTTPS redirect.
* Renewal.
* Renewal testing.
* TLS configuration.
* Security headers.
* WebSocket TLS.
* Certificate expiration monitoring.

### Exit gate

HTTPS works and renewal is demonstrably configured.

---

# PHASE 12 — Laravel Production Configuration

### Objective

Perform the final production-specific Laravel optimization/configuration pass.

### We will do

* config cache.
* route cache.
* view cache.
* event cache where appropriate.
* OPcache.
* PHP-FPM configuration.
* worker settings.
* trusted proxy configuration.
* session security.
* cookie security.
* CSRF.
* CORS.
* rate limiting.
* production logging.

### Important

We will **not enable Octane just because it exists**.

Your previous Phase 28.17 work showed FPM compatibility was verified while runtime-scale gates remained open. Therefore initial production should prioritize predictable FPM behavior.

---

# PHASE 13 — Queue Workers

### Objective

Make asynchronous Laravel jobs production-safe.

### We will configure

* worker containers/processes.
* concurrency.
* memory limits.
* timeouts.
* retry behavior.
* backoff.
* queue priorities.
* graceful shutdown.
* restart policies.
* failed jobs.
* idempotency.
* health monitoring.

### Special focus

Your previous testing identified queue idempotency as **partially verified**, so this phase must explicitly verify it in production-like runtime conditions.

---

# PHASE 14 — Scheduler

### Objective

Run Laravel scheduled tasks reliably.

### We will configure

* scheduler process.
* one scheduler instance initially.
* `schedule:run`/appropriate production mechanism.
* overlap prevention.
* task locking.
* logging.
* failure detection.
* restart behavior.

Your previous Phase 28.17 work verified scheduler `onOneServer()` + `withoutOverlapping()` behavior.

---

# PHASE 15 — Reverb / WebSockets

### Objective

Deploy real-time functionality.

### We will configure

* Reverb.
* private internal port.
* Nginx WebSocket proxy.
* authentication.
* TLS/WSS.
* connection limits.
* heartbeat.
* restart policy.
* health check.
* frontend connection.
* failure/reconnect behavior.

### Critical

Reverb's internal port will **not** be publicly exposed.

---

# PHASE 16 — Storage / Uploads / Permissions

### Objective

Make user-generated files production-safe.

### We will handle

* Laravel storage.
* uploads.
* public/private files.
* permissions.
* ownership.
* symlinks.
* disk capacity.
* file-size limits.
* MIME validation.
* executable-file protection.
* backup strategy.

---

# PHASE 17 — Mail / Notifications / External Services

### Objective

Connect external production dependencies.

### Includes

* SMTP/mail provider.
* email verification.
* password reset.
* transactional email.
* notification channels.
* third-party APIs.
* API keys.
* timeout/retry policies.
* failure handling.
* secrets.

---

# PHASE 18 — Payments & Webhooks

### Objective

Move payment functionality into production safely.

### We will verify

* payment credentials.
* production endpoints.
* callback URLs.
* webhook signatures.
* idempotency.
* replay protection.
* duplicate webhook handling.
* transaction state transitions.
* failed payment recovery.
* timeout handling.
* logging without sensitive data.

This is especially important because your previous concurrency testing already covered payment/webhook concurrency.

---

# PHASE 19 — Application Security Hardening

### Objective

Perform a dedicated security pass against the deployed application.

### Includes

* authentication.
* authorization.
* Sanctum.
* tenant isolation.
* IDOR/BOLA.
* CSRF.
* CORS.
* rate limits.
* validation.
* file uploads.
* SQL injection review.
* XSS.
* SSRF.
* mass assignment.
* secrets.
* error leakage.
* debug mode.
* security headers.
* session security.
* cookie flags.
* admin endpoints.
* webhook security.

---

# PHASE 20 — Backup & Recovery

### Objective

Prove we can recover DIYAR, not merely create backups.

### We will establish

```text
Hostinger backup
       +
Database backup
       +
Application/storage backup
       +
Configuration/secrets recovery
```

### We will test

* database backup.
* database restore.
* application recovery.
* storage recovery.
* restore to isolated location where possible.
* backup integrity.
* retention.
* backup failure detection.

### Exit gate

A backup that has never been restored is **not considered fully verified**.

---

# PHASE 21 — Logging & Observability

### Objective

Make production failures diagnosable.

### We will configure

* Laravel logs.
* Nginx logs.
* PHP-FPM logs.
* Docker logs.
* database logs.
* Redis logs.
* worker logs.
* scheduler logs.
* Reverb logs.
* log rotation.
* retention.

We will avoid uncontrolled log growth on an 8 GB VPS.

---

# PHASE 22 — Monitoring & Health Checks

### Objective

Know when something breaks.

### Monitor

* CPU.
* RAM.
* swap.
* disk.
* inode usage.
* Docker.
* containers.
* database.
* Redis.
* Laravel.
* Nginx.
* workers.
* scheduler.
* Reverb.
* SSL expiration.
* backup status.

### Health checks

We will define:

```text
/health
/readiness
```

or equivalent internal mechanisms where appropriate.

---

# PHASE 23 — Deployment & Rollback

### Objective

Create a repeatable deployment process.

### Deployment flow

```text
Git
 │
 ▼
Build
 │
 ▼
Validate
 │
 ▼
Backup
 │
 ▼
Deploy
 │
 ▼
Migrate
 │
 ▼
Cache
 │
 ▼
Health check
 │
 ▼
Smoke test
 │
 ▼
Success
```

Failure:

```text
Failure
  │
  ▼
Stop
  │
  ▼
Rollback
  │
  ▼
Restore if necessary
  │
  ▼
Verify
```

---

# PHASE 24 — CI/CD

### Objective

Automate safe deployments without creating an uncontrolled production pipeline.

### We will integrate

* GitHub.
* tests.
* build.
* image creation.
* deployment.
* migration strategy.
* secrets.
* rollback.
* deployment locking.
* health checks.

### Important

CI/CD will **not bypass production gates**.

---

# PHASE 25 — Production Data Migration

### Objective

Move/create production data safely.

### We will determine

* fresh database vs existing data.
* migration execution.
* seed strategy.
* admin creation.
* initial configuration.
* production tenant setup.
* reference data.
* indexes.
* database verification.

### No destructive migration without backup.

---

# PHASE 26 — Production Smoke & E2E Testing

### Objective

Prove the actual deployed system works.

### Test

```text
DNS
HTTPS
Frontend
Login
Registration
Authentication
Authorization
API
Database
Redis
Checkout
Inventory
Coupons
Payments
Webhooks
Uploads
Email
Queues
Scheduler
Realtime
Admin
Provider
Affiliate
```

We will test both happy and failure paths.

---

# PHASE 27 — Production Security Audit

### Objective

Audit the **actual running server**, not just configuration files.

### We will inspect

* public ports.
* Docker ports.
* UFW.
* IPv6.
* SSH.
* Fail2Ban.
* Nginx.
* TLS.
* headers.
* exposed files.
* exposed endpoints.
* database exposure.
* Redis exposure.
* container privileges.
* secrets.
* filesystem permissions.

### Required result

Internet-facing surface should essentially be:

```text
80/tcp
443/tcp
22/tcp
```

SSH may later be further restricted if operationally appropriate.

---

# PHASE 28 — Performance & Load Testing

### Objective

Measure actual production behavior.

This directly addresses the remaining gap from your previous Phase 28.17 work.

### We will measure

* API latency.
* database latency.
* Redis latency.
* PHP-FPM capacity.
* Nginx throughput.
* queue throughput.
* WebSocket connections.
* memory.
* CPU.
* concurrent requests.
* checkout performance.

### k6

Your previous report explicitly had:

```text
k6 / performance — DEFERRED
```

So this phase closes that gate.

---

# PHASE 29 — Concurrency / Runtime Scale

### Objective

Validate real concurrent production behavior.

### Critical scenarios

* simultaneous checkout.
* inventory race.
* coupon race.
* payment race.
* webhook duplication.
* payout concurrency.
* queue concurrency.
* scheduler concurrency.
* multiple HTTP workers.
* multiple application processes.
* Reverb concurrency.

### Particularly important

Your previous Phase 28.17 verdict was:

```text
Multi-node HTTP       NOT VERIFIED
Parallel HTTP checkout NOT VERIFIED
```

These become explicit acceptance criteria here.

---

# PHASE 30 — Failure & Disaster Recovery

### Objective

Intentionally break things and prove DIYAR recovers.

### We will test

* Laravel container crash.
* worker crash.
* Redis restart.
* database restart.
* Nginx restart.
* Reverb restart.
* network interruption.
* disk pressure.
* invalid deployment.
* failed migration.
* failed webhook.
* queue backlog.
* backup restoration.

### Goal

Not merely:

> "It works."

But:

> **"It fails safely and recovers predictably."**

---

# PHASE 31 — Production Readiness Review

### Objective

Formal go/no-go decision.

We'll review:

```text
Security             PASS/FAIL
Infrastructure       PASS/FAIL
Database             PASS/FAIL
Redis                PASS/FAIL
Application          PASS/FAIL
Payments             PASS/FAIL
Backups              PASS/FAIL
Monitoring           PASS/FAIL
Performance           PASS/FAIL
Concurrency           PASS/FAIL
Recovery              PASS/FAIL
Deployment            PASS/FAIL
Rollback              PASS/FAIL
```

### No "almost PASS"

Any P0/P1 issue blocks certification.

---

# PHASE 32 — GO-LIVE

### Objective

Move from controlled production preparation to real traffic.

### Procedure

```text
Final backup
     ↓
Final health check
     ↓
DNS verification
     ↓
TLS verification
     ↓
Application smoke test
     ↓
Enable production traffic
     ↓
Monitor
```

No unnecessary infrastructure changes during go-live.

---

# PHASE 33 — Post-Go-Live Stabilization

### Objective

Observe the system under real traffic.

### Monitor

* errors.
* latency.
* CPU.
* RAM.
* database.
* Redis.
* queues.
* WebSockets.
* failed jobs.
* payment failures.
* user-facing issues.

We distinguish:

```text
Real production issue
       vs
Expected behavior
       vs
Monitoring noise
```

---

# PHASE 34 — Final Production Certification

### Objective

Produce the final certification report.

### It will contain

```text
Infrastructure
Security
Application
Database
Redis
Payments
Backups
Monitoring
Performance
Concurrency
Recovery
Deployment
Rollback
Go-live
```

And a final verdict:

```text
CERTIFIED
```

or

```text
NOT CERTIFIED
```

with every remaining blocker explicitly listed.

---

# Master execution rule

The most important rule for this project is:

> **A phase is not complete because commands were executed. A phase is complete only when its verification gates pass.**

So our working format for **every phase** will be:

```text
PHASE XX — NAME

1. Objective
2. Preconditions
3. Current state
4. Actions
5. Configuration
6. Verification
7. Failure handling
8. Security checks
9. Performance/resource checks
10. Evidence
11. Exit criteria
12. PASS / FAIL / BLOCKED
```

And we'll maintain a running state:

```text
Phase 0  ✅
Phase 1  ✅
Phase 2  ⏳
Phase 3  ⏳
...
Phase 34 ⏳
```

### Current position

**Phase 0 — Planning: COMPLETE**

**Phase 1 — VPS Foundation & Security: COMPLETE**

**Phase 2 — Docker Engine & Container Runtime: NEXT**

Snapshot just created at **2026-09-06 14:13** is our rollback point immediately before Phase 2. We should preserve that state and start Phase 2 with **read-only Docker/pre-install checks first**, then install only what is actually required.
