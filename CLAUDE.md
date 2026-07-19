# CLAUDE.md

Welcome to the **antigravity** Personal Finance and Expense Tracker project. This file is the primary entrypoint for both human developers and AI assistants.

---

## 🚀 AI Session Initialization Sequence
Before performing any task or writing any code, you must execute the following startup sequence:
1. Read [[CLAUDE.md]] (this document)
2. Read [[CODEX.md]] (backend and architectural conventions)
3. Read [[AGENTS.md]] (AI behaviors and review checklists)
4. Read `memory/current-status.md` and `memory/current-priorities.md`
5. Load only the specific, related wiki page from the `wiki/` directory (e.g. `wiki/database.md` or `wiki/ai.md`)
6. Read the relevant Obsidian notes from the `knowledge/` directory

---

## 📝 Project Overview
**antigravity** is a premium, AI-native Personal Finance and Expense Tracker designed with inspiration from Apple Wallet, Stripe, and Linear. It allows users to track accounts, cash balances, transactions, budgets, subscriptions, recurring bills, shared groups, and savings goals. It features a multimodal vision scanner (Gemini API) that processes receipt photos to catalog expenses automatically and a context-loaded conversational coach for financial insights.

---

## 🏗️ Architecture Summary
The application follows a classic decoupled client-server architecture:
1. **Frontend**: Vite-powered React 19 Single Page Application (SPA). Uses TailwindCSS v4 for modern fluid styling, `@tanstack/react-query` for server state caching, and `Zustand` for global client session persistence.
2. **Backend**: Node.js Express server written in TypeScript. Exposes restful API routers mapped to controller endpoints under `/api`.
3. **Database**: Local PostgreSQL instance active on port `5433`. Managed through Prisma ORM for structured relational queries, schema synchronization, and seeding.
4. **AI Services**: Multimodal Gemini Vision API (`gemini-2.5-flash`) via the `@google/genai` client, providing automated receipt OCR scanning and conversational advisors.

---

## 📂 Project Structure
```text
Expense-Tracker/
├── CLAUDE.md                   # Primary operating operating guide
├── CODEX.md                    # Core architecture & API manual
├── AGENTS.md                   # AI behavioral specifications
├── APRD.md                     # Agentic Product Requirements Document (APRD)
├── run_db.sh                   # Script managing Postgres docker/local cluster
├── postgres_data/              # Local PostgreSQL data files
├── theme UI.css                # Global UI variables and base colors
├── tokens UI.json              # Design system tokens configuration
├── variables UI.css            # Responsive layout variables
├── memory/                     # AI persistent status and roadmaps
│   ├── current-status.md       # Present code completeness status
│   ├── current-priorities.md   # Immediate roadmaps and issues
│   ├── completed-features.md   # Feature log of recent additions
│   ├── known-bugs.md           # Tracked codebase issues
│   ├── architecture-decisions.md # Architectural decisions (ADRs)
│   ├── coding-conventions.md   # Style guides and TypeScript rules
│   └── release-notes.md        # Session releases and tags
├── wiki/                       # LLM Wiki pages ( Karpathy LLM Wiki )
│   ├── project-overview.md     # Product overview
│   ├── architecture.md         # Data flow and separates
│   ├── frontend.md             # React page mapping and hooks
│   ├── backend.md              # Express and prisma mappings
│   ├── database.md             # Database structure and relationships
│   ├── authentication.md       # OAuth 2.0 and JWT rotators
│   ├── api-reference.md        # API routes schemas
│   ├── ui-design-system.md     # HSL variables and styling conventions
│   ├── components.md           # Reusable component primitives library
│   ├── design-principles.md    # UI/UX design conventions
│   ├── analytics.md            # Spent aggregates and trends
│   ├── budgets.md              # Spent metrics limits
│   ├── transactions.md         # Expenses list structures
│   ├── wallets.md              # Cash, bank, cards accounts
│   ├── credit-cards.md         # Due balances and limits
│   ├── recurring-bills.md      # Subscriptions and bill obligations
│   ├── savings-goals.md        # Milestone target contributions
│   ├── deployment.md           # Render YAML settings
│   ├── roadmap.md              # Feature backlog
│   ├── changelog.md            # Repo modifications history
│   ├── troubleshooting.md      # Connection issues and solutions
│   └── ai.md                   # Gemini API OCR structures
├── knowledge/                  # Obsidian Brain knowledge vault
│   ├── Dashboard.md
│   ├── Transactions.md
│   ├── Wallets.md
│   ├── Credit Cards.md
│   ├── Budgets.md
│   ├── Savings Goals.md
│   ├── Recurring Bills.md
│   ├── Analytics.md
│   ├── Authentication.md
│   ├── API.md
│   ├── Database.md
│   ├── Frontend.md
│   ├── Backend.md
│   ├── Deployment.md
│   ├── Current Status.md
│   ├── Ideas.md
│   ├── Roadmap.md
│   └── APRD.md
├── backend/                    # Express Node.js application
│   ├── server.ts               # Main entrypoint (Port 5002)
│   ├── package.json            # Node backend dependencies
│   ├── tsconfig.json           # Compiler rules
│   ├── prisma/                 # Prisma configuration & seed scripts
│   └── src/
│       ├── db/                 # Database clients
│       ├── middleware/         # Auth verification guards
│       └── routes/             # Controller routes
└── frontend/                   # Vite React 19 application
    ├── vite.config.ts          # Vite bundle configuration (Port 5173)
    ├── tsconfig.json           # TS rules
    └── src/
        ├── App.tsx             # Route maps
        ├── index.css           # Global HSL themes & Tailwind v4 imports
        ├── api/                # API Client services
        ├── components/         # Reusable layouts & modals
        ├── store/              # Zustand Auth store
        ├── types/              # Type definitions
        └── pages/              # Primary view layouts
```

---

## 🛠️ Development Commands

### Database Management
* Start local PostgreSQL: `./run_db.sh start`
* Stop local PostgreSQL: `./run_db.sh stop`
* Push schema migrations: `npx prisma db push` (inside `backend/`)
* Run database seed script: `npx prisma db seed` (inside `backend/`)

### Backend Dev Commands
* Start Express dev server (Port `5002`): `npm start` (inside `backend/`)
* Run Prisma studio: `npx prisma studio` (inside `backend/`)

### Frontend Dev Commands
* Start Vite development server (Port `5173`): `npm run dev` (inside `frontend/`)
* Compile and build client assets: `npm run build` (inside `frontend/`)
* Typecheck validation: `npx tsc --noEmit` (inside `frontend/`)

---

## 🎨 UI & Design Philosophy
Our application follows the premium visual aesthetics of Apple Wallet, Notion, Stripe, and Linear.
* **Colors**: Pure monochromes (Black, White) paired with emerald accents (`#17C964` / green tags) and ruby warning elements (`#FF4D4F` / red tags). Managed strictly via custom HSL CSS properties.
* **Typography**: Clean *Inter* for system controls, labels, and statistics. Bold *Source Serif 4 Italic* solely for branding logos (`antigravity.`) and semantic callouts.
* **Layouts**: Thick rounded bounds (Cards: `22px`, inputs/buttons: `18px`), soft ambient shadows, spacious paddings, and glassmorphic modal backdrops.
* **Animations**: Fluid spring layouts powered by `framer-motion`.

---

## 🔒 Authentication Flow
* JWT auth: Session tokens (expiry 15m) stored in-memory by frontend client. Refresh tokens (expiry 7d) stored in `localStorage` as `fintech_refresh_token` and checked via `POST /api/auth/refresh`.
* Google OAuth: Verifies Google Identity Services (GSI) credential payload via backend `google-auth-library` Client ID checks. New Google users receive default categories and sample records automatically.

---

## 🗄️ Database Conventions
* Models are mapped to lowercase plural table names (`@@map("users")`).
* Decimal columns are stored using `@db.Decimal(12, 2)` or `@db.Decimal(10, 2)` to avoid floating-point errors.
* OnDelete cascade rules are explicitly declared where dependent (e.g. Wallet cascade deletes transactions). Category deletions are blocked if budgets or transactions reference them.

---

## ⚛️ State Management Approach
* **Server State**: Managed via `@tanstack/react-query` to cache database fetches (categories, credit cards, bills, goals) with simple mutation updates.
* **Client UI State**: Managed via simple React `useState` hooks for layout and forms.
* **Global Auth Session**: Managed through a `Zustand` store (`fintech_token` client mapping, checking user verification, silent refreshing).

---

## 💻 API & Routing Conventions
* Router files reside in `backend/src/routes/` and are mapped as independent middleware under `server.ts`.
* Path payloads are validated with `express-validator` rules.
* All database actions must strictly be scoped by the authenticated user's ID (`userId: req.user.id`).
* Responses return consistent JSON models. Errors match `{ error: "Message details" }` with appropriate status codes (400, 401, 403, 404, 500).

---

## 📝 Naming Conventions
* **Files**: PascalCase for components/pages (`ExpenseForm.tsx`), camelCase for helpers/routers/stores (`authStore.ts`, `expenses.ts`, `prisma.ts`).
* **Variables & Functions**: camelCase for variables/methods (`getOrCreateWallet`), UPPER_SNAKE_CASE for constants/env variables (`JWT_SECRET`, `PORT`).
* **TypeScript Types**: PascalCase for interface declarations (`Category`, `Transaction`).

---

## 📂 Documentation & AI Workflows
We treat documentation as a first-class citizen in this repository:
1. **Startup Protocol**: Assistant always reads `CLAUDE.md`, `CODEX.md`, `AGENTS.md`, and current statuses before editing.
2. **Context-Efficiency**: Load only related subsystem files to avoid token overhead.
3. **Obsidian & Wiki Sync**: Any source-level code modifications must instantly trigger updates in the corresponding `/wiki` files, `/knowledge` Obsidian files, and the `/memory` logs.

---

## 📅 Roadmap & Backlog
1. **Multi-Currency Conversions**: Support live API conversions between USD, EUR, and local selections.
2. **Plaid Integration**: Mock backend banking connections.
3. **Dark Mode Charts**: Introduce dark theme custom charts using HSL values.

---

## ⚠️ Known Issues
1. **Missing Wallet Endpoint**: Frontend requests `/expenses/wallets` via the query client, but the backend lacks a `/wallets` router configuration, causing `404 Not Found` queries.
2. **macOS Port Conflict**: AirPlay Receiver conflicts with default Express port `5000`. Express has been remapped to port `5002`.

---

## 🎯 Current Priorities
1. **Establish AI Knowledge Base**: Implement this LLM Wiki + Obsidian Brain structure.
2. **Security Audit**: Ensure database scoping rules are consistent across all Express route files.
3. **Solve Wallet Endpoint**: Implement the `/expenses/wallets` endpoint in `expenses.ts` to return the user's active wallets list.

---

## 🔗 Related Resources
* Read [[CODEX.md]] for backend/Prisma manuals.
* Read [[AGENTS.md]] for developer guidelines.
* Visit [[wiki/project-overview]] for detailed walkthroughs.
