# DIYAR — System Architecture

> **Stage:** 0 — Phase 0.4  
> **Version:** V1 target architecture

---

## 1. Architecture Style

**Modular monolith** — single Laravel 13 deployable with clear domain module boundaries. No microservices in V1.

---

## 2. System Context

```mermaid
flowchart TB
  Customer[Customer Browser]
  Vendor[Vendor Browser]
  Admin[Admin Browser]

  Customer --> SPA[React SPA - frontend/]
  Vendor --> SPA
  Admin --> SPA

  SPA -->|HTTPS /api/v1| API[Laravel 13 API - backend/]

  API --> MySQL[(MySQL)]
  API --> Cache[Laravel Cache]
  API --> Queue[Database Queue]
  API --> Storage[Object Storage]
  API --> SMS[SMS Provider]
  API --> Email[Email Provider]
  API --> PGW[Payment Gateway]
  PGW -->|Webhooks| API
```

---

## 3. Layered Architecture (Backend)

```text
HTTP Request
    ↓
Route (/api/v1/*)
    ↓
Middleware (Sanctum, throttle, role)
    ↓
Controller (thin — request/response only)
    ↓
Action / Service (business logic)
    ↓
Domain Models (Eloquent)
    ↓
MySQL | Cache | Queue | Storage
```

**Rules:**
- Controllers do not contain business logic
- Financial/order operations use `DB::transaction()`
- Gateway-specific code only in Payment module adapters

---

## 4. Frontend Architecture (Target)

```text
Pages (existing)
    ↓
Feature hooks (TanStack Query)
    ↓
API client (Axios + interceptors)
    ↓
/api/v1 REST API
```

**Progressive migration:** Keep existing component structure; add `src/api/`, `src/types/`, `src/hooks/`.

---

## 5. Authentication Flow

```mermaid
sequenceDiagram
  participant SPA as React SPA
  participant API as Laravel API
  participant SMS as SMS Provider

  SPA->>API: POST /auth/register
  API->>SMS: Send OTP
  API-->>SPA: pending_verification

  SPA->>API: POST /auth/otp/verify
  API-->>SPA: Sanctum token + user

  SPA->>API: Authenticated requests (Bearer/cookie)
```

- SPA mode: Sanctum cookie for same-domain or Bearer token for cross-domain
- Admin: seeder-created only

---

## 6. Checkout & Payment Flow

```mermaid
sequenceDiagram
  participant SPA as React SPA
  participant API as Laravel API
  participant PGW as Payment Gateway

  SPA->>API: POST /checkout/preview
  API-->>SPA: Server-calculated totals

  SPA->>API: POST /checkout
  Note over API: BEGIN TRANSACTION
  API->>API: Validate cart, stock, reserve
  API->>API: Create Order + VendorOrders
  API->>PGW: Initiate payment
  API-->>SPA: payment_redirect_url
  Note over API: COMMIT

  PGW->>API: Webhook (signed)
  API->>API: Verify signature
  API->>API: Mark paid, ledger, notify
```

---

## 7. Infrastructure (V1)

| Component | V1 Choice | Notes |
|-----------|-----------|-------|
| App server | PHP-FPM + Nginx | Single instance acceptable for launch |
| Database | MySQL 8 | Managed recommended |
| Cache | File/database cache via Laravel | No Redis |
| Queue worker | `php artisan queue:work` | Database driver |
| Storage | Local dev; S3 prod | Laravel filesystem |
| Frontend hosting | CDN/static (GitHub Pages → production CDN) | Separate from API |
| SSL | Required | API + frontend |

---

## 8. Environments

| Env | Purpose |
|-----|---------|
| Local | Dev: Vite + Laravel Sail/Valet |
| Staging | QA + webhook testing |
| Production | Live |

---

## 9. Security Architecture

- Sanctum authentication on all protected routes
- Policy-based authorization per resource
- Rate limiting on auth endpoints
- Webhook signature verification
- File upload validation (MIME, size)
- CORS restricted to frontend origin
- No secrets in frontend bundle

See `SECURITY.md` for details.

---

## 10. Deployment Architecture

```text
Cloudflare (CDN/WAF)
    ├── app.diyar.sa → Static React build (frontend/)
    └── api.diyar.sa → Laravel (backend/)
            ├── MySQL
            ├── Queue worker (cron/supervisor)
            └── Storage (media)
```

---

## 11. Scalability Path (Post-V1)

When justified by metrics:
- Redis for cache + queue
- Horizontal app servers behind load balancer
- Read replicas for MySQL
- Meilisearch for advanced search
- WebSockets (Reverb) for chat
- PostgreSQL migration only if proven need

---

## 12. Repository Layout

```text
diyar-marketplace/          # Git root
├── github/                 # Workflow documentation
├── conception/             # This knowledge base
├── frontend/               # React SPA
└── backend/                # Laravel 13 API
```

---

*See `DOMAIN_ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `DEPLOYMENT.md`, `adr/`.*
