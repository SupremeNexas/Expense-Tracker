# Current Status
Last Updated: 2026-07-19

The Personal Finance and Expense Tracker repository is fully operational. All Express backend routers, Prisma connectors, and React client pages compile successfully.

---

## 🚀 Running Instances
* **Backend REST API**: Active on port `5002` (listening for token credentials logins and Gemini chats).
* **Database**: Local PostgreSQL cluster active on port `5433` (socket `/tmp`) using trust authentication.
* **Frontend client**: Vite React dev server active on port `5173`.

---

## 🛠️ Status Overview

### Backend APIs (`/api`)
* [x] **Authentication**: Password hashing, email registers, profiles validation.
* [x] **Google OAuth**: Verified token validation via `/api/auth/google`.
* [x] **Expenses**: Full CRUD with auto-wallet balance increments/decrements.
* [x] **Categories**: Grid classification controls with usage shields.
* [x] **Budgets**: Spent aggregates calculations and thresholds caps.
* [x] **Credit Cards**: Cycle records, dues trackers, warning badges.
* [x] **Bills & Subscriptions**: Obligations calendar and monthly burn rate normalized gauge.
* [x] **Goals**: Milestone targets and goal contribution logs.
* [x] **Shared Groups**: Multi-member split ledgers and settlements.
* [x] **AI Services**: Multimodal receipt vision OCR scanner and conversation coach drawer.

### Frontend Client Pages
* [x] **SaaS Landing Page**: Features marquee sliders, pricing plans, and FAQs.
* [x] **Workspace Dashboard**: Renders budget circular progress meters, pie distributions, trend lines, and the AI coach drawer.
* [x] **Transactions List**: Full table search filtering, tags editing, and CSV downloads.

---

## ⚠️ Known Issues
* No critical active blockers or unmapped REST endpoints tracked.

---

## 🔗 Related Resources
* Read [[CLAUDE.md]] for commands.
* Read [[CODEX.md]] for standards.
* Read [[memory/current-priorities.md]] for roadmap priorities.
