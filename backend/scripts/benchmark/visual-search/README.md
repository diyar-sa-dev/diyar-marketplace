# Visual Search Phase 3 Benchmark (Isolated)

**NOT production code.** Temporary spike scripts for Stage 29 Phase 3 readiness.

## Run (Docker — GD required)

```bash
docker cp backend/scripts/benchmark/visual-search <container>:/tmp/visual-search-benchmark
docker exec <container> php -d memory_limit=512M /tmp/visual-search-benchmark/run-phase3-benchmark.php
docker exec -e DB_HOST=mysql -e DB_DATABASE=... -e DB_USERNAME=... -e DB_PASSWORD=... \
  <container> php /tmp/visual-search-benchmark/run-sql-explain.php
```

Outputs land in `output/` (or container temp when unwritable).

## Files

| File | Purpose |
|------|---------|
| `lib/VisualHash.php` | GD dHash-64 spike (letterbox 256² → 9×8) |
| `lib/FixtureGenerator.php` | Synthetic JPEG/PNG/WebP fixtures |
| `run-phase3-benchmark.php` | Timing, accuracy, bucket, Hamming benchmarks |
| `run-sql-explain.php` | TEMP table EXPLAIN / EXPLAIN ANALYZE |
| `run-bucket-recall-extended.php` | Prefix-radius recall analysis |

Remove or keep isolated; do not wire into Laravel autoload or routes.
