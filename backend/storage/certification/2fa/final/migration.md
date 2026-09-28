# Migration Certification — 2FA

**Migration:** `2026_09_11_100000_add_two_factor_to_users_table`  
**Target DB:** `diyar_production_local` (MySQL in diyar-production stack)

## Pretend output

```sql
alter table `users` add `two_factor_enabled` tinyint(1) not null default '0' after `email_verified_at`;
alter table `users` add `two_factor_confirmed_at` timestamp null after `two_factor_enabled`;
```

## Execution

```
php artisan migrate --force
2026_09_11_100000_add_two_factor_to_users_table .... DONE
```

## Verification

- `Schema::hasColumn('users', 'two_factor_enabled')` → true
- Existing users preserved; cert fixture users operate normally
- Non-destructive additive migration only

## Rollback strategy

- Rollback drops columns; requires backup before rollback in real production
- Recommended: `mysqldump` via backup profile before deploy
