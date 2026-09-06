# Stage 26.4 — Advanced Shipping

Modular carrier → zone → method → rule → rate engine extending V1 flat-rate shipping.

## Documentation

| File | Purpose |
|------|---------|
| [AUDIT.md](./AUDIT.md) | Pre-implementation audit |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Architecture, API, rules |
| [ACCEPTANCE_MATRIX.md](./ACCEPTANCE_MATRIX.md) | Gate checklist (26.4 + 26.5) |
| [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Verification evidence |

## Default behavior

When `vendor_shipping_settings.use_advanced_rules` is `false`, Stage 10 flat-rate + pickup remains authoritative.
