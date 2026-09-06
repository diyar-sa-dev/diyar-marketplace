# Network Audit — Phase 28.13

## Delivery path

```text
Browser → DNS → TLS → (CDN optional) → Nginx → PHP-FPM/Laravel → Redis → MySQL
```

## Environments supported

| Model | Frontend | API | Cache |
|-------|----------|-----|-------|
| Local dev | Vite :3000 + proxy | artisan :8000 | array/file |
| Docker | compose stack | api container | Redis |
| VPS (Hostinger) | Nginx static dist | Nginx → PHP-FPM | Redis + MySQL 8 |
| CDN optional | CDN → Nginx origin | api subdomain | edge + origin |

## DNS assumptions (production)

| Host | Role |
|------|------|
| `diyar.com` / `www` | Marketplace SPA |
| `admin.diyar.com` | Admin SPA (same build) |
| `api.diyar.com` | Laravel API + `/storage` public media |
| WebSocket | Reverb/Pusher host (env `VITE_REVERB_*`) |

## HTTP features

| Feature | Dev | VPS template | CDN |
|---------|-----|--------------|-----|
| HTTP/2 | via Vite preview proxy | ✅ ssl http2 | ✅ |
| gzip | Vite build | ✅ nginx gzip | ✅ (CDN default) |
| keep-alive | browser default | ✅ upstream keepalive 32 | ✅ |
| immutable hashed assets | Vite contenthash | ✅ `/assets/` location | ✅ |

## Findings

| ID | Severity | Finding | Action |
|----|----------|---------|--------|
| NET-AUD-001 | P2 | Blanket API `no-store` blocked anonymous edge cache | **FIXED** — `ApplyHttpCachePolicy` |
| NET-AUD-002 | P2 | Nginx template incomplete for SPA deploy safety | **FIXED** — HTML no-cache + storage TTL |
| NET-AUD-003 | P3 | No CDN env hooks | **FIXED** — `DIYAR_CDN_*`, `VITE_CDN_BASE_URL` |
| NET-AUD-004 | P3 | Missing OG/preconnect metadata | **FIXED** — `index.html` |
