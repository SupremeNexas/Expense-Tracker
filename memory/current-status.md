# Initial Status
Last Updated: 2026-07-05

The fintech expense tracker codebase is fully operational and configured for production-level TypeScript compile checks. Both backend and frontend servers build without warning.

---

## 🚀 Running Instances
* **Backend REST API**: Running on port `5002` (listening for JWT logins and AI chats).
* **Database**: Local PostgreSQL instance active on port `5433` (socket `/tmp`) using trust authentication.
* **Frontend client**: Vite React 19 dev server listening on port `5173`.

---

## 🛠️ Status Overview

### Backend APIs (`/api`)
* [x] **Authentication**: Password salting, register, login, profile check, and refresh token validations.
* [x] **Expenses**: Full CRUD with auto-wallet increments/decrements.
* [x] **Categories**: Grid classification CRUD with in-use protection shields.
* [x] **Budgets**: Threshold setups and spent queries.
* [x] **Credit Cards**: Usage meters, risk tags, and due alerts.
* [x] **Bills**: Calendar timeline of obligations.
* [x] **Goals**: Milestone saving targets with logs.
* [x] **Subscriptions**: Automated monthly burn metrics.
* [x] **Shared Groups**: Multi-user shared ledger splitters and settlement markers.
* [x] **AI Services**: Receipt multimodal scanning, floating coach dashboard advice, and chat help.

### Frontend Views
* [x] **Public Landing Page**: Scrolling marquee, pricing grids, testimonials, and FAQs.
* [x] **Protected Workspace Dashboard**: Area/Pie charts, stats cards, and AI floaters.
* [x] **Transactions List**: Full table search filtering, CRUD popups, and CSV exports.

---

## 🔗 Related Resources
* Read [[CLAUDE.md]] for commands.
* Read [[CODEX.md]] for standards.
* Read [[current-priorities.md]] for what is next.
