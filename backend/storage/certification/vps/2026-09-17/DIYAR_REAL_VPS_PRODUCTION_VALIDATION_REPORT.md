# DIYAR REAL VPS PRODUCTION VALIDATION REPORT

**Date:** 2026-09-17  
**Role:** Independent production QA / performance / reliability validation  
**Scope:** Real Hostinger VPS only. No application code, schema, Nginx, MySQL, Redis, Octane, or worker changes were made.  
**Result class:** Access-blocked campaign. Capacity numbers below are **NOT TESTED** on the VPS.

Evidence file: `backend/storage/certification/vps/2026-09-17/access-evidence.json`

---

## 1. Executive Summary

```text
VPS:              195.200.14.40 (PTR srv1957772.hstgr.cloud) — Hostinger hostname
CPU:              NOT VERIFIED (SSH did not succeed)
RAM:              NOT VERIFIED (SSH did not succeed)
OS:               OBSERVED from SSH banner only: OpenSSH_9.6p1 Ubuntu-3ubuntu13.19
                  (consistent with Ubuntu 24.04 LTS; uname was not executed)
Docker:           NOT VERIFIED
Runtime:          NOT VERIFIED (Octane/Swoole vs PHP-FPM unknown on this host)
Octane workers:   NOT VERIFIED
Public API:       NOT REACHABLE from this workstation
Frontend:         Vercel landing page at https://deyarhome.com (not the VPS API)
```

The workstation SSH config `diyar-prod` points at this IP as user `deploy` with `~/.ssh/id_ed25519`. The key was rejected. Direct HTTP/HTTPS to the VPS timed out. No production API DNS exists for `api.deyarhome.com` / `api.diyar.sa` / `api.diyar.com`.

Therefore this campaign **did not measure** sustained RPS, concurrent users, MySQL, Redis, Octane, Nginx, queues, or Reverb on the real VPS.

---

## 2. Overall Verdict

```text
NOT READY
```

This is not a statement that the application code is broken. It is a statement that **this VPS cannot be certified for an initial real launch from evidence collected today**:

- The production API is not publicly reachable from the QA workstation.
- Operator SSH from the configured key is not authorized.
- After repeated publickey failures, TCP/22 from this workstation later timed out (possible host firewall / fail2ban). SSH probing was stopped.
- No mixed-workload, RPS, concurrency, saturation, soak, or recovery test ran against the VPS.

Windows/Docker k6 results from 2026-09-16 remain **REGRESSION REFERENCE only**. They are **not** production capacity evidence.

---

## 3. Verified Capacity

```text
Maximum verified sustained RPS:     NOT TESTED
Maximum verified concurrent users:  NOT TESTED
Recommended operating RPS:          NOT VERIFIED (no VPS measurement)
Observed saturation point:          NOT TESTED
```

No VPS HTTP request completed. Inventing a KVM2 budget from hardware labels or Windows Docker would violate the campaign rules.

---

## 4. Performance Table

| Test | VUs | RPS | p50 | p95 | p99 | 4xx | 5xx | 429 | timeouts | CPU | RAM | DB | Redis | Result |
| ---- | --- | --- | --- | --- | --- | --- | --- | --- | -------- | --- | --- | -- | ----- | ------ |
| Environment audit (SSH) | — | — | — | — | — | — | — | — | SSH later TIMEOUT | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | BLOCKED |
| Baseline public API | — | — | — | — | — | — | — | — | curl 28 on :80/:443/:8093 | — | — | — | — | NOT TESTED |
| Stage A 10/25/50/100 users | — | — | — | — | — | — | — | — | — | — | — | — | — | NOT TESTED |
| Stage B 50–250 RPS | — | — | — | — | — | — | — | — | — | — | — | — | — | NOT TESTED |
| Stage C 100–1000 concurrent | — | — | — | — | — | — | — | — | — | — | — | — | — | NOT TESTED |
| Stage D saturation | — | — | — | — | — | — | — | — | — | — | — | — | — | NOT TESTED |
| Spike / burst | — | — | — | — | — | — | — | — | — | — | — | — | — | NOT TESTED |
| Endurance 30–60 min | — | — | — | — | — | — | — | — | — | — | — | — | — | NOT TESTED |
| Recovery | — | — | — | — | — | — | — | — | — | — | — | — | — | NOT TESTED |

---

## 5. Endpoint Performance

| Surface | VPS result |
| ------- | ---------- |
| Search | NOT TESTED |
| Catalog | NOT TESTED |
| Product | NOT TESTED |
| Auth | NOT TESTED |
| Cart | NOT TESTED |
| Wishlist | NOT TESTED |
| Services | NOT TESTED |
| Other public APIs | NOT TESTED |
| Checkout / orders / inventory | NOT TESTED (also unsafe without a confirmed test path) |
| Visual search | NOT TESTED |
| Smart filters | NOT TESTED |
| Notifications | NOT TESTED |
| Reverb | NOT TESTED |
| Health `GET /api/v1/health` on VPS IP | OBSERVED: connection timeout |
| Health via `https://deyarhome.com/api/v1/health` | OBSERVED: HTTP 404 (Vercel landing, no API rewrite) |

---

## 6. Infrastructure Bottleneck

```text
NOT PROVEN
```

No in-stack telemetry was collected. The only production-path observation is **external unreachability**:

- HTTP/HTTPS to the VPS IP timed out (firewall, no listener, or provider filter — **not distinguished**).
- SSH publickey rejection is an access-control finding, not an application bottleneck.
- MySQL 3306 and Redis 6379 were not confirmed open (follow-up TCP scan timed out on all probed ports, including 22).

Do not treat “2 vCPU / 8 GB KVM2” as measured. Those are plan labels from docs, not `nproc` / `free -h` output.

---

## 7. Stability

```text
container restarts:     NOT VERIFIED
OOM:                    NOT VERIFIED
memory growth:          NOT VERIFIED
queue growth:           NOT VERIFIED
database instability:   NOT VERIFIED
Redis instability:      NOT VERIFIED
worker instability:     NOT VERIFIED
SSH from this IP:       OBSERVED open, then later TIMEOUT after failed logins
```

---

## 8. Security / Correctness

| Check | Result |
| ----- | ------ |
| Authentication isolation | NOT TESTED |
| Session isolation | NOT TESTED |
| Data correctness | NOT TESTED |
| Cart correctness | NOT TESTED |
| Inventory correctness | NOT TESTED |
| SSH | OBSERVED: password auth not offered; publickey only; configured workstation key not authorized |
| Hostinger hPanel | OBSERVED: login page, no operator session in QA browser |
| Database/Redis public exposure | NOT VERIFIED (cannot claim closed; later TCP scan timed out) |

No cross-user data issue was found because authenticated traffic was not executed.

---

## 9. Recovery

NOT TESTED. Load was never applied, so there is no recovery curve.

**OBSERVED (access path):** after a burst of failed SSH publickey attempts against several usernames, TCP/22 from this workstation timed out. That is consistent with fail2ban / Hostinger firewall, but **not proven** without host logs.

---

## 10. Windows vs VPS

### Windows reference evidence (REGRESSION REFERENCE)

Source: `backend/storage/certification/k6/KVM2_OCTANE_PRE_DEPLOY_REPORT.md` (2026-09-16).  
Stack: local `diyar-production` Docker Octane 2 workers + nginx `:8093` on a Windows host. **Not the Hostinger VPS.**

| Profile | Peak VUs | Achieved RPS | Search p95 | Error % | Class |
| ------- | -------- | ------------ | ---------- | ------- | ----- |
| vu10 | 10 | 39.8 | ~13 ms | 0 | REGRESSION REFERENCE |
| rps100 | 130 | 169.2 | ~207 ms | 0 | REGRESSION REFERENCE |
| vu100 | 100 | 260.6 | ~400 ms | 0 | REGRESSION REFERENCE |
| vu1000 | 1000 | 347.7 | ~2.7 s | 0 | REGRESSION REFERENCE |
| vu10000 | 3461+ | 729 | ~4.1 s | 56.9 | REGRESSION REFERENCE |

Windows **must not** be quoted as “the VPS can handle 100–150 RPS”. That sentence in the pre-deploy report was a projection, not a VPS measurement.

### VPS production evidence

| Item | Result |
| ---- | ------ |
| Host reachable at 195.200.14.40 | OBSERVED (SSH banner, then later timeout) |
| Ubuntu OpenSSH 9.6p1 | OBSERVED |
| Public API HTTP | OBSERVED timeout |
| Load p50/p95/p99 | NOT TESTED |
| Octane vs FPM on VPS | NOT VERIFIED |

---

## 11. Scaling Trigger

No VPS scaling trigger is evidence-based, because no VPS saturation series was run.

Do **not** copy Windows triggers (`p95 > 2s`, `error rate > 1%`) onto this host until they are reproduced here.

The only operational trigger observed today:

```text
SSH publickey failure from the QA workstation
→ later TCP/22 timeout from the same workstation
```

That is an access/firewall event, not an application capacity trigger.

---

## 12. Recommended Deployment Position

```text
Not production-ready
```

Reasons that are evidenced, not guessed:

1. There is no working public API hostname for DIYAR (`api.deyarhome.com` does not resolve).
2. The live site `deyarhome.com` is a Vercel landing page; `/api/v1/health` is 404.
3. The VPS IP does not answer on 80/443/8093 from this network.
4. The documented SSH user/key cannot log in.

Until SSH works and `GET /api/v1/health` (and readiness) succeed from outside, launch traffic cannot be supported on evidence.

---

## 13. NOT VERIFIED

Everything the campaign required beyond host identity remains unverified, including:

```text
CPU / RAM / disk / disk type / container limits
Docker and Compose versions
PHP, Laravel, Nginx, MySQL, Redis versions
Octane/Swoole vs PHP-FPM
Octane worker count / queue worker count
Baseline p50/p95/p99 for catalog, search, product, auth, cart, wishlist, services
10 / 25 / 50 / 100 concurrent users
50 / 100 / 150 / 200 / 250 / 300 / 350 / 400 / 500 RPS
250 / 500 / 1000 concurrent users
Spike recovery
30–60 minute endurance
MySQL connections, slow queries, locks
Redis evictions / clients
Nginx active connections
Queue depth / failed jobs
Reverb connections
Authenticated multi-user isolation
Checkout, payments, inventory mutation
10k concurrent users
multi-node / load balancer / CDN origin shielding
real external customer traffic
payment gateway under production load
```

---

## Capacity classification (required table)

| Capacity | Status |
| -------- | ------ |
| 10 users | NOT TESTED |
| 50 users | NOT TESTED |
| 100 users | NOT TESTED |
| 250 users | NOT TESTED |
| 500 users | NOT TESTED |
| 1000 users | NOT TESTED |
| 50 RPS | NOT TESTED |
| 100 RPS | NOT TESTED |
| 150 RPS | NOT TESTED |
| 200 RPS | NOT TESTED |
| 250 RPS | NOT TESTED |
| 300 RPS | NOT TESTED |
| 350 RPS | NOT TESTED |
| 400 RPS | NOT TESTED |
| 500 RPS | NOT TESTED |

---

## If DIYAR is deployed today on this VPS, what traffic can we safely support based on evidence?

```text
VERIFIED:     none. No successful VPS API request. No load stage completed.
PROVISIONAL:  none. A landing page on Vercel is not VPS API capacity.
NOT SUPPORTED: any claimed production RPS or concurrent-user level on this VPS,
               including 10 users, 50 RPS, 100 RPS, and 150 RPS.
```

---

## Access findings (what blocked the campaign)

1. **SSH:** `ssh diyar-prod` → `deploy@195.200.14.40: Permission denied (publickey)`. Same key rejected for `root` and other guessed users. Auth methods offered: `publickey` only.
2. **HTTP:** `curl` to `http://195.200.14.40/` and `https://195.200.14.40/` and `:8093` health → timeout.
3. **DNS:** production API names used in docs do not exist for `deyarhome.com` / `diyar.sa` / `diyar.com`.
4. **Panel:** Hostinger hPanel required login; this session had none.

Workstation public key that was offered (add this on the VPS, then re-run validation):

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMBkV42MJh/wRe4XtXhmyyt3fKCnyHUMp/z3FofDQ1rd diyar-vps-admin
```

**Do not retry SSH from this workstation until the key is installed and any IP block is cleared.** Further failed logins may extend a lockout.

---

## Unblock checklist (operator, not this QA session)

From Hostinger browser console (or any already-authorized key):

1. Confirm the VPS is the intended production host (`hostname`, `ip a`).
2. Install the public key above for the real deploy user (`~/.ssh/authorized_keys`, mode 600).
3. If fail2ban/UFW blocked this QA IP, unban it.
4. Confirm UFW/Hostinger firewall allows 80/443 (and only those) for the public API.
5. Confirm Docker stack is up: `docker compose ps` — app, nginx, mysql, redis, queues, reverb, scheduler.
6. Confirm runtime is Octane/Swoole or FPM with evidence (`ps`, compose file, `php artisan octane:status` if Octane).
7. Publish API DNS (`api.<domain>` → this VPS, Cloudflare as designed).
8. Prove `curl -fsS https://api.<domain>/api/v1/health` and `/health/ready` from the internet.
9. Re-run this campaign: inspect → baseline → mixed load → telemetry → report. Still do not change application code during the test.

Until steps 2, 5, and 8 succeed, VPS capacity remains **NOT VERIFIED**.
