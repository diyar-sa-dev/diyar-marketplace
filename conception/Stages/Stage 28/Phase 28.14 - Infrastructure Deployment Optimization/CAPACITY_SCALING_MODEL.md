# Capacity & Scaling Model — Phase 28.14

## Small VPS (2 GB RAM)

| Resource | Allocation |
|----------|------------|
| PHP-FPM max_children | 10 |
| Queue workers | 2 (1 critical + 1 notifications) |
| Redis maxmemory | 256 MB |
| MySQL buffer pool | 512 MB |

**Workload:** Demo / early production (<50 concurrent users)

## Medium VPS (4 GB RAM)

| Resource | Allocation |
|----------|------------|
| PHP-FPM max_children | 20 |
| Queue workers | 6 (Supervisor template) |
| Redis maxmemory | 512 MB |
| MySQL buffer pool | 1.5 GB |

**Workload:** Production MVP (50–200 concurrent)

## Large VPS (8 GB RAM)

| Resource | Allocation |
|----------|------------|
| PHP-FPM max_children | 36 |
| Queue workers | 8+ |
| Redis maxmemory | 1 GB |
| MySQL buffer pool | 3 GB |

**Workload:** Growth phase (200–500 concurrent)

## Connection budget

```
MySQL max_connections ≥ (PHP-FPM workers × 1.2) + (queue workers × 2) + 20 admin margin
```

## Future horizontal scaling (documented, not implemented)

- Multiple PHP-FPM nodes behind Nginx load balancer
- Shared Redis + managed MySQL
- Object storage for media (S3-compatible)
- CDN for frontend assets (28.13 ready)
- Read replicas for analytics queries
