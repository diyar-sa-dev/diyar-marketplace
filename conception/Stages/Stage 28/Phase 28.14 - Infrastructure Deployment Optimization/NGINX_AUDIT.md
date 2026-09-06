# Nginx Audit — Phase 28.14

## Performance

- gzip level 5, min 256 bytes
- upstream keepalive 32 (API)
- immutable cache for `/assets/*`
- HTML `no-cache` for SPA shell
- `/storage/` 7-day public cache

## Security (28.14 additions)

- `server_tokens off`
- Deny `/.env`, `/.git`, `/.ht*`
- Deny `*.sql`, `*.bak`, `*.log`, `*.ini`, `*.sh`
- SPA server denies `*.php` execution in static root

## Limits alignment

| Layer | Upload limit |
|-------|--------------|
| Nginx | 12 MB |
| PHP-FPM | 12 MB upload / 14 MB post |
| Laravel | Media validation per endpoint |

## HTTPS

- TLS 1.2+ assumed (Let's Encrypt)
- HSTS `max-age=31536000; includeSubDomains`
- Security headers on API + SPA servers

## Brotli

Optional — enable when `ngx_brotli` module available on VPS.
