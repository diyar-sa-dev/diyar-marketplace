# Phase 18.3 — Plan

See [STAGE_18_PLAN.md](../STAGE_18_PLAN.md) §5 and [STAGE_18_ARCHITECTURE.md](../STAGE_18_ARCHITECTURE.md) §7.

## Tasks (summary)

1. `system_settings` migration + model
2. `SystemSettingService` + `EffectiveConfigService`
3. Seeder from `config/diyar.php` (non-secrets)
4. Filament settings pages (grouped)
5. Migrate affiliate + finance consumers first
6. Feature flags + theme public endpoint
7. Tests: validation, cache, audit, sensitive mask

## Exit criteria

- Admin can change affiliate payout minimum without deploy
- Secrets remain env-only
- All Phase 18.3 tests pass
