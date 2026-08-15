# Development Rules

> **Status:** CURRENT

---

## Monorepo Commands

Always run from the correct directory:

```bash
# Frontend
cd frontend && npm ci && npm run dev

# Backend
cd backend && composer install && php artisan serve
```

**Never** run Vite from repository root.

---

## Git Safety

Before major changes:

```bash
git status
git branch
git log -n 10
```

**Forbidden without explicit authorization:**

- `git reset --hard`
- `git clean -fd`
- Force push to `main`

Preserve uncommitted product-owner work. Use focused commits. Do not commit unless explicitly requested.

---

## Windows / OneDrive

- Vite must ignore `backend/**`, `conception/**`, `.git/**`
- Vite cache: `frontend/node_modules/.vite` only
- Prefer Node 20 LTS
- Do not remove `backend/vendor/fruitcake/php-cors` — Laravel dependency

---

## Scope Boundaries

| Stage | Allowed | Forbidden |
|-------|---------|-----------|
| Stage 1 | Foundation, config, CI, tests scaffold | Business domains, fake marketplace data |
| Stage 2+ | Per master plan | Unauthorized domain work |

Frontend mock UI may remain until API integration in later stages.

---

## Branch Conventions

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready / Pages deploy |
| `dev` | Active development |
| `feature/*` | Feature branches |
| `fix/*` | Bug fixes |

---

## Commit Conventions

Use conventional prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`, `refactor:`

Focus on **why**, not just what.

---

## Environment

- Secrets in `.env` — never commit
- Document variables in `.env.example` and runbooks
- `backend/.env.example` and `frontend/.env.example` are the templates
