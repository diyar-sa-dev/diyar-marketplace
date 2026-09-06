# DIYAR Deployment (KVM2)

## Prerequisites

- Hostinger KVM2 (2 vCPU, 8 GB RAM, 100 GB NVMe)
- Domain + Cloudflare (API + realtime subdomains)
- Vercel project for frontend
- Google Workspace / Gmail app password for SMTP (store in `production.env` only)

## 1. Server bootstrap

```bash
# SSH as root, create deploy user, harden sshd, enable UFW:
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Install Docker + Compose plugin (official docs)
```

## 2. Clone and configure

```bash
git clone <REPO_URL> /opt/diyar
cd /opt/diyar
cp deploy/docker/production.env.example deploy/docker/production.env
# Edit: APP_KEY, DB_*, REDIS_*, REVERB_*, MAIL_*, MYFATOORAH_*, SANCTUM_STATEFUL_DOMAINS, APP_URL, FRONTEND_URL
php artisan key:generate --show   # paste into production.env APP_KEY
```

## 3. TLS (host Nginx or Caddy in front of Docker)

Production Nginx in Docker listens on `:80` inside the stack. Terminate TLS on the host reverse proxy or mount certs into `deploy/nginx/kvm2-docker.conf` (extend for `:443`).

Cloudflare: **Full (strict)** to origin; enable WebSockets for `realtime.<DOMAIN>`.

## 4. Start stack

```bash
docker compose -f docker-compose.production.yml --env-file deploy/docker/production.env up -d --build
docker compose -f docker-compose.production.yml exec app php artisan migrate --force
docker compose -f docker-compose.production.yml exec app php artisan storage:link
docker compose -f docker-compose.production.yml exec app php artisan config:cache
docker compose -f docker-compose.production.yml exec app php artisan route:cache
```

## 5. Health verification

```bash
curl -fsS https://api.<DOMAIN>/api/v1/health
curl -fsS https://api.<DOMAIN>/api/v1/health/ready
```

## 6. Vercel frontend

Set in Vercel project environment (production):

```
VITE_API_URL=https://api.<DOMAIN>
VITE_REVERB_HOST=realtime.<DOMAIN>
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
VITE_REVERB_APP_KEY=<same as REVERB_APP_KEY>
```

Deploy via Vercel Git integration. See `deploy/VERCEL.md`.

## 7. CI/CD (GitHub Actions)

Pipeline should run: PHPUnit → Vitest → Playwright → `npm run build` → Docker build → push image → SSH deploy:

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml exec -T app php artisan migrate --force
curl -fsS https://api.<DOMAIN>/api/v1/health/ready
```

## 8. Zero-downtime notes

- Run migrations before traffic switch when backward-compatible
- Recreate workers after app image update: `docker compose up -d --no-deps queue-critical queue-default scheduler reverb-1 reverb-2`
- Verify `/api/v1/health/ready` before announcing deploy complete

## Rollback

See `deploy/ROLLBACK.md`.
