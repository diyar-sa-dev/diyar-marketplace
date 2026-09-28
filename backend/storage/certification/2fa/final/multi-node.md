# Multi-Node Certification

**Status:** NOT VERIFIED

## Reason

`docker-compose.production.yml` runs a **single** PHP-FPM `app` service. Nginx upstream is `app:9000` (one replica). Horizontal scale was not executed to avoid unreviewed production topology changes.

## Available alternate stack

`docker-compose.multinode.yml` provides Octane api-a/api-b for future multi-node certification. Not run in this cycle.

## Design confidence

- Challenge store and OTP cache use **Redis** with atomic locks
- Parallel race on single FPM node: **1 success / 7 failures** (PASS)
- Cross-node behavior inferred from shared Redis architecture; explicit node A→B verify not executed
