# DIYAR Rollback

## When to rollback

- `/api/v1/health/ready` fails after deploy
- Error rate spike (5xx) sustained >5 minutes
- Migration caused incompatible schema (restore from backup)

## Image rollback (preferred)

```bash
cd /opt/diyar
export PREVIOUS_TAG=<git-sha-or-tag>   # from last known good deploy record

# Pin images if using registry tags; otherwise checkout previous commit:
git checkout $PREVIOUS_TAG

docker compose -f docker-compose.production.yml --env-file deploy/docker/production.env up -d --build

docker compose -f docker-compose.production.yml exec -T app php artisan migrate:status
curl -fsS https://api.<DOMAIN>/api/v1/health/ready
```

## Worker / Reverb recycle after rollback

```bash
docker compose -f docker-compose.production.yml up -d --force-recreate \
  queue-critical queue-default scheduler reverb-1 reverb-2
```

## Database rollback

If migration is irreversible:

1. Stop app workers: `docker compose stop app queue-critical queue-default`
2. Restore backup per `deploy/BACKUP-RESTORE.md`
3. Deploy previous application image
4. Verify auth, orders, payments sample queries

## Rollback drill checklist

- [ ] Record current git SHA / image tag
- [ ] Deploy intentionally broken config OR failed health gate
- [ ] Execute rollback commands above
- [ ] Verify health, login, catalog, queue depth
- [ ] Document elapsed time and commands used

**Local drill status:** NOT EXECUTED on Hostinger VPS (requires production host).
