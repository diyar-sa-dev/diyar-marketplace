# DIYAR — Security Architecture

> **Stage:** 0

## Principles

1. Never trust client input for business decisions
2. Authenticate every protected operation
3. Authorize by role + ownership
4. Transaction-safe financial operations
5. Verify payment webhooks cryptographically

## Threat Model (V1)

| Threat | Mitigation |
|--------|------------|
| IDOR on orders/cart | Policy ownership checks |
| Price manipulation | Server-side price load at checkout |
| Stock overselling | DB transaction + reservation |
| Coupon abuse | Server validation, usage limits |
| Unauthorized vendor access | Vendor profile scoping on all dashboard queries |
| Webhook spoofing | Signature verification |
| Malicious uploads | MIME whitelist, size limits, store outside webroot |
| Brute force auth | Rate limiting, lockout |
| XSS | React escaping + sanitize blog HTML |
| CSRF | Sanctum SPA protection |

## Password Policy

Min 8 chars, upper, lower, number, special — Laravel validation rule class.

## Admin Access

- Seeder-created only
- All admin actions logged (V1.1 enhanced audit)

## File Upload

| Context | Max Size | Types |
|---------|----------|-------|
| Product image | 5 MB | JPG, PNG, JPEG, WEBP |
| Service attachment | 10 MB | JPG, PNG, JPEG, WEBP , PDF |
| Avatar | 1 MB | JPG, PNG, JPEG, WEBP  |

## PCI

No card data stored — gateway tokenization only.

## Secrets

- `.env` never committed
- Frontend only receives public keys (payment client-side tokenization if required by gateway)
