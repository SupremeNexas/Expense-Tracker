# Release Notes
Last Updated: 2026-07-19

This document logs releases, tags, and production deployment milestones.

---

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
