# Security Specification

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## Threat model (V1)

| Threat | Control |
|--------|---------|
| IDOR on designs | `RoomDesignPolicy`: user_id match |
| Mass assignment | FormRequest allowlist; document validated separately |
| Oversized JSON | 512 KiB cap + item count cap |
| Malicious product_ids | Server validates existence + visibility |
| Try-in-room upload abuse | Auth, throttle, quota, size/dimension limits |
| MIME spoofing | finfo + image re-encode or strict allowlist |
| Decompression bomb | dimension cap before decode |
| Path traversal on storage | Laravel private disk + UUID paths |
| Malicious SVG | Disallow SVG uploads V1 |
| AI cost drain | quotas, circuit breaker, job caps |
| Rate limit bypass | per-user + IP fallback on anonymous deny |
| Stale session | 401 → client retains local doc until re-auth (**PREPARED** UX) |

---

## Authorization

- All design CRUD: `auth:sanctum`
- Guest designer (if product allows): read-only local session without save — **PREPARED** flag; default require login to save

---

## Logging

**Do not log:** full `document` JSON, upload bytes, provider prompts with embedded photos.

**Do log:** user_id, design id, version, byte size, job id, provider error codes.

---

## Content Security

- Result images: served via signed URLs, short TTL
- CSP: no change required for canvas if scripts already nonce/hash per existing frontend policy — verify at implementation

---

## Compliance

- Room photos = sensitive; privacy policy update required before Try-in-Room GA — **BLOCKED** on legal copy (product)

---

## Security tests (30.10)

- Policy tests: user A cannot GET user B design
- Upload tests: reject executable, oversize, wrong MIME
- Fuzz document validation endpoint
