# Scalability Notes — Phase 28.13

## Current architecture scales to

- 10k products (DB indexes 28.9, pagination enforced)
- Thousands of concurrent browsers (stateless API + Redis cache)
- CDN-heavy static delivery (hashed assets, optional `VITE_CDN_BASE_URL`)

## Delivery layer headroom

| Layer | Scale lever |
|-------|-------------|
| Static assets | CDN immutable cache → origin offload 90%+ |
| Anonymous catalog | HTTP 60s + Redis versioned cache |
| Authenticated traffic | no-store → always origin (by design) |
| Media | Nginx `/storage/` 7d cache + optional media CDN |
| WebSocket | Reverb horizontal scaling (documented in deploy/) |

## Future (not implemented — compatible)

- PostgreSQL migration (28.9 documented)
- Redis cluster
- MySQL read replicas
- Multi-region CDN

No premature microservices introduced.
