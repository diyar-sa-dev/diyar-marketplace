# Postman — DIYAR API v1

> **Status:** CURRENT — Stage 1 foundation  
> **Last updated:** 2026-08-15

---

## Assets

| Asset | Path |
|-------|------|
| Collection | [`postman/DIYAR-API-v1.postman_collection.json`](./postman/DIYAR-API-v1.postman_collection.json) |
| Local environment (example) | [`postman/DIYAR-API-Local.postman_environment.json`](./postman/DIYAR-API-Local.postman_environment.json) |

Collection name: **DIYAR API — v1**

---

## Import the Collection

1. Open Postman
2. **Import** → select `DIYAR-API-v1.postman_collection.json`
3. **Import** → select `DIYAR-API-Local.postman_environment.json`
4. Select environment **DIYAR API — Local** in the top-right dropdown

---

## Configure the Environment

Safe committed variables:

| Variable | Example | Purpose |
|----------|---------|---------|
| `base_url` | `http://localhost:8000` | Laravel server root (no trailing slash) |
| `api_version` | `v1` | API version segment |

Requests use: `{{base_url}}/api/{{api_version}}/...`

If your backend runs on another port (e.g. `8765`), change `base_url` locally.

---

## Run the Health Request

1. Start backend:

```bash
cd backend
php artisan serve
```

2. In Postman: **Health → GET /api/v1/health**
3. Expect **200** and JSON:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "diyar-api",
    ...
  }
}
```

---

## Test JSON 404 Behavior

**Error / API Behavior → GET unknown route (JSON 404)**

Expect **404**:

```json
{
  "success": false,
  "message": "Resource not found."
}
```

---

## Local Secrets — Do Not Commit

Never add these to the committed Postman environment:

```text
APP_KEY
MyFatoorah API keys
MSEGAT API keys
OpenAI API keys
Database passwords
Webhook secrets
Sanctum tokens (use Postman session/collection variables locally)
```

For Stage 2+:

1. Create a **private** Postman environment (Postman cloud or local-only export)
2. Store `auth_token`, provider keys, and webhook secrets there
3. Add `.gitignore` entries if exporting private env files locally

---

## FUTURE — Stage 2 Identity Folder

The collection includes a folder **FUTURE — Stage 2 Identity** with **description only** — no functional requests for unimplemented endpoints.

When Stage 2 ships:

1. Add requests under `Auth/` with real paths
2. Document required headers (CSRF, Bearer)
3. Update this file and [AUTHENTICATION.md](./AUTHENTICATION.md)

---

## Related

- [HEALTH.md](./HEALTH.md)
- [API_CONVENTIONS.md](./API_CONVENTIONS.md)
