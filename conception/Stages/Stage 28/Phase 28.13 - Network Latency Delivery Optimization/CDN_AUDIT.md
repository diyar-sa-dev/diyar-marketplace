# CDN Audit — Phase 28.13

**CDN status:** Not physically provisioned — **architecture ready**

---

## CDN-ready components

| Asset type | CDN suitable | Cache policy | Invalidation |
|------------|-------------|--------------|--------------|
| Vite `/assets/*.[hash].js/css` | ✅ Yes | immutable 1y | New deploy = new hashes |
| Locale chunks `en/ar.[hash].js` | ✅ Yes | immutable | Deploy |
| Public `/storage/*` media | ✅ Yes | 7d–30d | URL change on re-upload |
| `index.html` | ⚠️ Origin only | no-cache | Every deploy |
| API (anonymous catalog) | ⚠️ Conditional | 60s public | Redis version bump + TTL |
| API (authenticated) | ❌ Never | no-store | N/A |

---

## Enable CDN (when ready)

### 1. Assets CDN

```env
# frontend build
VITE_CDN_BASE_URL=https://cdn.diyar.com

# backend (optional media CDN)
DIYAR_CDN_ENABLED=true
DIYAR_CDN_ASSETS_URL=https://cdn.diyar.com
DIYAR_CDN_MEDIA_URL=https://cdn.diyar.com/storage
```

### 2. CDN origin rules

- Origin: VPS Nginx
- Cache anonymous GET only on `api.diyar.com` paths matching public catalog
- **Bypass cache when:** `Cookie`, `Authorization`, `POST`, `PATCH`, `DELETE`
- **Include in cache key:** `Accept-Language` for public catalog

### 3. Purge strategy

- **Deploy:** No purge needed for hashed assets; purge `index.html` path only if CDN caches HTML (not recommended)
- **Catalog update:** Rely on 60s HTTP TTL + Redis invalidation; optional API purge by URL prefix

---

## Security

- Do not enable "Cache Everything" on API subdomain
- Private B2B/chat/payment paths must never receive `public` Cache-Control (verified in middleware)
