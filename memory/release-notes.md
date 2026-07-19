# Release Notes
Last Updated: 2026-07-19

This document logs releases, tags, and production deployment milestones.

---

## [v1.4.0] - 2026-07-19
Phase 6 — Engineering Excellence, DevOps & Open Source Readiness.

### Added
* GitHub Actions CI pipeline with dual backend/frontend jobs and `npm ci` caching.
* Root `package.json` with `setup`, `typecheck`, and `build` developer convenience scripts.
* MIT `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`.
* `CHANGELOG.md` covering all four phases using Keep a Changelog standard.
* GitHub PR template, bug report, feature request, and security issue templates.
* `CODEOWNERS` for automatic pull request reviewer assignment.
* VS Code `extensions.json` and `settings.json` for consistent editor DX.
* `wiki/architecture-diagrams.md` with Mermaid request flow, ER, and RAG sequence diagrams.
* `wiki/developer-onboarding.md` with step-by-step contributor workspace setup guide.
* Security, performance, and repository health audit reports (artifacts).

### Fixed
* `Badge` component: replaced `label` prop with `children` pattern in `WorkspaceSettings.tsx` and `CopilotPage.tsx`.
* `activeTab` variable renamed to `activeSubTab` in `WorkspaceSettings.tsx` (TS2552).
* Invalid `"secondary"` Badge variant replaced with `"neutral"` in `CopilotPage.tsx`.
* Root `package.json` trailing comma JSON syntax error.

## [v1.3.0] - 2026-07-19
Phase 5 — Enterprise Features, Automation & Platform Scaling.

### Added
* Workspace and WorkspaceMember database models and scoping logic.
* Scoped request validation headers (`x-workspace-id`) with Personal fallback.
* Enforced OWNER/ADMIN/EDITOR/VIEWER Role-Based Access Control (RBAC) middleware checks.
* Collaborative Shared Wallets and Shared Budgets.
* Rule-based automation engine (`triggerAutomations`) executing tags, savings allocations, and notifications.
* Chron-equivalent background job schedulers (`startSchedulerJobs`).
* CSV spreadsheet and JSON structured data export features.
* Per-wallet currency conversions and exchange rate provider helpers.
* Workspace settings and collaborator control panel (`WorkspaceSettings.tsx`).
* Immutable database action audit logs.
* Express API v1 routing versioning mounts.

## [v1.2.0] - 2026-07-19
Phase 4 — AI Financial Copilot.

### Added
* Modular LLM provider architecture (`Gemini`, `OpenAI`, `Claude`, `OpenRouter`, `Ollama`, `Mock`).
* Two-step Retrieval-Augmented Generation (RAG) chat advisor.
* Dynamic category and payment preferences memory tracking.
* Programmatic/LLM hybrid Financial Health Scoring and suggestions.
* Budget limit recommendation generator and spends cash flow forecasting.
* AI-driven subscription scanners and spends insights.
* Dedicated **AI Copilot** bento dashboard (`CopilotPage.tsx`).
* OCR upload receipt processing pipeline with verification forms.

## [v1.1.0] - 2026-07-19
Phase 2 — UI/UX Refinement & Product Experience.

### Added
* Custom HSL design tokens, `.shimmer` grids, and `.interactive-hover` transitions in `index.css`.
* Premium UI component primitives: `Button`, `Input`, `Select`, `Badge`, `ProgressBar`.
* Focused Framer Motion modals and exit-slide toasts with focus traps and escape listeners.
* Custom shimmer loaders `SkeletonCard`, `SkeletonChart`, and `SkeletonList` for data fetching.
* Standardized illustration views for empty collections using `EmptyState`.
* Dynamic resizing layouts responsive to collapsible sidebar states.
* Exposed `GET /api/expenses/wallets` backend REST endpoint to resolve 404 console bugs.

## [v1.0.0] - 2026-07-19
AI-Native Knowledge System launch.

### Added
* Full **LLM Wiki** technical layer in `/wiki` detailing all submodules.
* **Obsidian Brain** connected vault in `/knowledge` featuring backlinks and tags for cross-referencing.
* **Persistent Memory Layer** in `/memory` to maintain session-to-session state.
* Expanded developer operating guides in `CLAUDE.md`, `CODEX.md`, and `AGENTS.md`.

---

## [v0.1.0] - 2026-07-05
Initial functional release.
* Migrated sqlite database connections to PostgreSQL (Port 5433).
* Implemented Express routing for all CRUD capabilities.
* Google OAuth integration.
* Multimodal Gemini scanner API.

---

## 🔗 Related Resources
* Visit [[wiki/changelog]] for a full commit history breakdown.
