# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.3.0] — 2026-07-19 — Enterprise Workspaces & Platform Scaling

### Added
- Multi-tenant `Workspace` and `WorkspaceMember` data model with PERSONAL, FAMILY, BUSINESS, PROJECT types
- Role-Based Access Control (RBAC) middleware enforcing OWNER / ADMIN / EDITOR / VIEWER tiers
- `x-workspace-id` header scoping with automatic Personal Workspace fallback for backward compatibility
- Collaborative shared wallets (transaction tracking per creator and last editor)
- Collaborative shared budgets with per-member expenditure contribution breakdowns
- Rule-based automation engine (`engine.ts`) supporting `TRANSACTION_CREATED` and `BUDGET_OVERRUN` triggers
- Immutable `AuditLog` table and `logAction` service recording all state mutations
- Background scheduler (`scheduler.ts`) for monthly budget rollovers and subscription auto-debits
- CSV, JSON, and tabular HTML data export formatter (`formatter.ts`)
- Per-wallet currency field and offline exchange rate converter (`converter.ts`)
- API versioning: all routes now mounted under `/api/v1/` with `/api/` compatibility aliases
- `WorkspaceSettings.tsx` control panel: member management, invitations, automation rules, audit trail, and data exports
- Active workspace switcher dropdown in `Sidebar.tsx`
- Automatic `x-workspace-id` header injection in API client (`client.ts`)
- GitHub Actions CI pipeline (`.github/workflows/ci.yml`) with separate backend and frontend jobs
- Root `package.json` with `setup`, `typecheck`, and `build` scripts for one-command DX
- Community open-source files: `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`
- GitHub PR template and Issue templates (bug, feature, security)
- Architecture diagrams wiki page with Mermaid sequence and ER diagrams
- Developer onboarding guide wiki page

### Fixed
- `Badge` component usage: replaced non-existent `label` prop with `children` pattern
- `activeTab` variable renamed to `activeSubTab` in `WorkspaceSettings.tsx` (TS2552)
- Invalid `"secondary"` Badge variant in `CopilotPage.tsx` replaced with `"neutral"`
- Root `package.json` trailing comma JSON syntax error

---

## [1.2.0] — 2026-07-19 — AI Financial Copilot

### Added
- Modular AI provider factory supporting Gemini, OpenAI, Claude, OpenRouter, Ollama, and local offline Mock fallback
- Retrieval-Augmented Generation (RAG) chat pipeline with intent classification and Prisma query mapping
- Financial health scorer, rolling budget advisor, month-end spend forecast, and subscription detector (`coach.ts`)
- Centralized prompt library (`prompts/index.ts`)
- User preference memory tracker (`memory.ts`) to skip redundant LLM calls
- AI routes (`/api/ai/chat`, `/api/ai/analyze`, `/api/ai/categorize`, `/api/ai/forecast`, `/api/ai/subscriptions`, `/api/ai/receipt`, `/api/ai/insights`)
- 10-minute in-memory cache for expensive AI endpoints
- `CopilotPage.tsx` with health meters, forecast summaries, subscription scanner, receipt OCR upload, and RAG chat UI
- Multipart `FormData` upload fix in `client.ts` (automatic `Content-Type` boundary)

---

## [1.1.0] — 2026-07-19 — UI/UX Refinement & Product Polish

### Added
- Apple/Linear-inspired monochromatic design token system in `index.css`
- Reusable UI primitive library: `Button`, `Input`, `Select`, `Badge`, `ProgressBar`, `Skeleton`, `EmptyState`
- Animated modal with Framer Motion spring physics and focus-trapping
- Sliding toast notification system with `AnimatePresence` exit transitions
- Collapsible sidebar with dynamic header width calculations
- SaaS landing page with feature marquee, pricing plans, and FAQ accordion

### Fixed
- `GET /api/expenses/wallets` endpoint returning 404 (missing route handler added)
- Sidebar width not recalculating correctly on collapse/expand transition

---

## [1.0.0] — 2026-07-19 — Production Readiness

### Added
- Comprehensive `.gitignore` covering env files, build artifacts, DB files, logs, and OS files
- `backend/.env.example` and `frontend/.env.example` placeholder templates
- Centralized `validation.ts` middleware using `express-validator`
- Centralized `error.ts` global error handler (strips stack traces in production)
- Relative API URL base path (`/api`) for Vite proxy and Vercel routing compatibility
- Complete `README.md` with local setup, PostgreSQL port config, and deployment guide

### Removed
- Legacy Mongoose/MongoDB route files (`backend/db/`, `backend/models/`, `backend/routes/`)
- Unused production dependencies: `mongoose`, `better-sqlite3`, `cloudinary` (backend), `react-hook-form`, `zod` (frontend)
