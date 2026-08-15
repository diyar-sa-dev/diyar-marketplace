# Coding Rules

> **Status:** CURRENT

---

## General

1. **Minimize scope** — smallest correct diff
2. **Match existing conventions** — read surrounding code first
3. **No over-engineering** — no premature abstractions
4. **Self-explanatory code** — comments only for non-obvious logic
5. **Tests** — meaningful coverage for critical paths; no trivial assertions

---

## PHP / Laravel

| Tool | Purpose |
|------|---------|
| Laravel Pint | PHP formatting (`vendor/bin/pint`) |
| PHPUnit | Backend tests (Stage 1 baseline) |
| PHPStan/Larastan | Deferred to post–Stage 1 evaluation (Phase 1.3 decision) |

**Naming:**

- Controllers: `App\Http\Controllers\Api\V1\{Name}Controller`
- Support classes: `App\Support\{Domain}\{Class}`
- Routes: grouped under `Route::prefix('v1')`

**Do not:**

- Put business logic in routes
- Create fake marketplace entities in Stage 1
- Use `DB::raw` without justification

---

## TypeScript / React

| Tool | Purpose |
|------|---------|
| TypeScript | Strict mode (`tsc --noEmit`) |
| ESLint | Lint (Phase 1.3) |
| Prettier | Format (Phase 1.3) |
| Vitest | Frontend tests (Phase 1.4) |

**Naming:**

- Components: PascalCase files
- Hooks: `use{Name}.ts`
- API modules: `{resource}.ts` in `src/api/`
- Types: `{domain}.ts` in `src/types/`

**Imports:**

- Use `.tsx`/`.ts` extensions where existing code does (project convention)
- Prefer named exports for utilities; default export for page components

---

## Folder Conventions

### Backend (Stage 1 foundation)

```
backend/app/
├── Http/Controllers/Api/V1/
├── Http/Middleware/
├── Support/Api/
└── Providers/
```

### Frontend (Stage 1 foundation)

```
frontend/src/
├── api/
├── types/
├── hooks/
├── lib/
├── utils/
├── components/
├── features/
├── pages/
├── layouts/
├── routes/
└── context/
```
