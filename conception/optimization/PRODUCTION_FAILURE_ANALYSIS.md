# Production Failure Analysis (Game Day)

| Scenario | Detection | Impact | Recovery | Data integrity |
|----------|-----------|--------|----------|----------------|
| Redis down 5 min | Cache miss storm; queue fails | Slower; jobs stall | Restart Redis; workers retry | MySQL authoritative — OK |
| MySQL slow | Health degraded; timeouts | Checkout/admin slow | Scale/optimize queries | Transactions rollback |
| MySQL down | /health/ready fail | Full outage | Failover/restore backup | No partial commits if TX used |
| Queue workers stopped | failed_jobs grows | Async email/webhooks delay | Supervisor restart | Webhook idempotency prevents dup pay |
| Payment provider down | 503 on checkout | Cannot pay | Queue reconciliation | Orders stay unpaid |
| AI provider down | 503 assistant | Chat only | Disable via admin toggle | N/A |
| CDN down | Static 404/slow | Ugly/slow UI | Serve from origin | N/A |
| 100 concurrent checkouts | FPM queue | Latency spike | Scale FPM workers | Inventory locks prevent oversell |
| Duplicate webhook | payload_hash unique | Ignored | — | **Safe** |
| Stale EffectiveConfig cache | SettingsChanged listener | Wrong loyalty/rules until TTL | Per-key invalidate | Low risk (TTL 3600s) |

**First production break (predicted):** PHP-FPM worker exhaustion under marketing traffic spike, not database.
