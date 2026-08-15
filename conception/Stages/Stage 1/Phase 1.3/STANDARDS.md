# Phase 1.3 — Development Standards

> **Status:** CURRENT  
> **Stage:** 1 — Engineering Foundation

---

## Toolchain

| Area | Tool | Command |
|------|------|---------|
| Editor | EditorConfig | `.editorconfig` (repo root) |
| PHP format | Laravel Pint | `cd backend && vendor/bin/pint` |
| PHP static analysis | PHPStan/Larastan | **DEFERRED** — evaluate in Stage 2 |
| TypeScript check | `tsc --noEmit` | `cd frontend && npm run typecheck` |
| TS/JS lint | ESLint 9 flat config | `cd frontend && npm run lint` |
| JS format | Prettier | `cd frontend && npm run format` |

---

## PHPStan Decision

**Decision:** Defer Larastan/PHPStan to early Stage 2.

**Rationale:** Stage 1 establishes foundation with minimal domain code. Adding PHPStan before modules exist adds CI friction without meaningful coverage. Revisit when Identity domain lands.

---

## Naming Conventions

### Backend

- Controllers: `App\Http\Controllers\Api\V1\{Name}Controller`
- Support: `App\Support\{Area}\{Class}`
- Tests: mirror namespace under `tests/Feature/Api/V1/`

### Frontend

- Pages: `PascalCase` in `src/pages/`
- Hooks: `use{Name}.ts` in `src/hooks/`
- API modules: `src/api/{resource}.ts`
- Types: `src/types/{domain}.ts`

---

## Branch & Commit Conventions

| Pattern | Use |
|---------|-----|
| `main` | Production / Pages deploy |
| `dev` | Active integration |
| `feature/*` | Feature work |
| `fix/*` | Bug fixes |

Commit prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`, `refactor:`

---

## Environment Documentation

| File | Purpose |
|------|---------|
| `backend/.env.example` | Laravel + DIYAR backend vars |
| `frontend/.env.example` | Vite frontend vars |
| `conception/runbooks/LOCAL_SETUP.md` | Local dev guide |
