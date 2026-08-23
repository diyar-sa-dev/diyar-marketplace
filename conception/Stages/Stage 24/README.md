# Stage 24 — Production Deployment

Production-ready architecture for DIYAR V1.

## Topology

```
Internet → CDN/Nginx → React SPA (diyar.com, admin.diyar.com)
                    → Laravel API (api.diyar.com)
                    → MySQL (authoritative)
                    → Redis (cache + queues)
                    → S3-compatible storage
Workers: API → Redis queue → Supervisor workers
```

## Artifacts

| Artifact | Path |
|----------|------|
| Nginx example | `deploy/nginx/production.conf.example` |
| Workers | `deploy/workers/README.md`, `deploy/supervisor/` |
| Production env template | `backend/.env.example` (production section) |
| Backup runbook | `conception/runbooks/DATABASE_BACKUP.md` |
| Deployment architecture | `conception/architecture/DEPLOYMENT.md` |

## Release flow

1. Merge to `dev` → CI + staging deploy workflow + smoke
2. Manual promotion to `main` → production deploy (not automatic from arbitrary branches)
3. Post-deploy: health, readiness, smoke, monitor failed_jobs

## Related docs

- [PRODUCTION runbook](../../runbooks/PRODUCTION.md)
- [STAGE_24_COMPLETION_REPORT.md](./STAGE_24_COMPLETION_REPORT.md)
