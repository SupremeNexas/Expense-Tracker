# CODEX.md

This document defines the technical rules, engineering guidelines, and architecture standards for the **antigravity** project.

---

## 💻 Backend & API Standards

### Express Router Conventions
* All route endpoints must reside in `backend/src/routes/` and be mounted under `/api/` inside `server.ts`.
* Endpoints must use the `authenticate` middleware from `src/middleware/auth` to protect user-space data.
* Controllers must validate payloads using `express-validator` rules before database query insertion.
* All decimal calculations (amounts, costs) must be handled via Prisma's `Prisma.Decimal` class to avoid floating-point math issues.

### Express Request Typecasting
* Since query parameters (`req.query`) and route param IDs (`req.params.id`) can be parsed as arrays or strings, always cast them using `as string` (e.g. `req.params.id as string`) when feeding them into Prisma where clauses to satisfy type constraints.
* Cast database return payloads to `any` where needed to allow accessing relation values (like `transaction.category.name`) when direct relational typing gets obscured.

---

## 🗄️ Database & Prisma Conventions
* **Engine**: PostgreSQL running locally on port `5433` (Unix socket `/tmp`).
* **Connection String**: `DATABASE_URL="postgresql://postgres@localhost:5433/expense_tracker?schema=public"`
* **Prisma Mappings**:
  * Decimal fields mapped as `@db.Decimal(10, 2)` to match monetary precision.
  * Relational links defined with cascading structures or protected guards (e.g., category deletions are blocked if transactions or budgets exist for that category).
* **Seeding**: Always run `npx prisma db seed` to initialize default categories, wallets, and a demo profile (`demo@example.com` / `password123`).

---

## ⚛️ Frontend & State Architecture

### React 19 & Compilation
* Built via Vite and compiled in TypeScript.
* Use `@tanstack/react-query` (`useQuery`, `useMutation`) for caching server states.
* Use `zustand` stores for client state management (e.g., sessions and auth checks).
* Avoid direct CSS styling; use custom classes defined in `src/index.css` (e.g., `.premium-card`, `.btn-premium`, `.input-premium`) for visual aesthetics.

### Zustand Authentication Store (`store/authStore.ts`)
* Manages the authenticated user object.
* Stores short-lived JWT tokens in memory, and the `fintech_refresh_token` in `localStorage`.
* Performs silent token refreshments on initialization errors.

---

## 🔒 Security Practices
* **Passwords**: Hash using `bcryptjs` with a cost factor of `10` before storage.
* **Tokens**: JWT access tokens are short-lived. Refresh tokens are tracked in the database and exchanged for fresh access tokens via `/api/auth/refresh`.
* **Database Guards**: Every relational query must be scoped by the authenticated user's ID (`userId: req.user.id`). Never expose cross-user details.

---

## 🔗 Related Resources
* Read [[CLAUDE.md]] for project indices and commands.
* Read [[AGENTS.md]] for code checklists and git commits.
* Visit [[wiki/database]] for Prisma schemas.
