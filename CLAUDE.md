# CLAUDE.md

Welcome to the **antigravity** Personal Finance and Expense Tracker project. This file is the primary entrypoint for both human developers and AI assistants.

## 🚀 AI Session Initialization Sequence
Before performing any task or writing any code, you must execute the following startup sequence:
1. Read [[CLAUDE.md]] (this document)
2. Read [[CODEX.md]] (backend and architectural conventions)
3. Read [[AGENTS.md]] (AI behaviors,Review checklists, and checklists)
4. Read `memory/current-status.md` and `memory/current-priorities.md`
5. Load only the specific, related wiki page from the `wiki/` directory (e.g. `wiki/database.md` or `wiki/ai.md`)

---

## 📂 Project Structure
```text
Expense-Tracker/
├── CLAUDE.md                   # This index file
├── CODEX.md                    # Core architecture manual
├── AGENTS.md                   # AI behavioral specifications
├── run_db.sh                   # Script managing Postgres docker/local cluster
├── postgres_data/              # Local PostgreSQL data files
├── memory/                     # AI persistent status and roadmaps
│   ├── current-status.md
│   ├── current-priorities.md
│   └── architecture-decisions.md
├── wiki/                       # Andrej Karpathy LLM Wiki pages
│   ├── database.md
│   ├── authentication.md
│   ├── analytics.md
│   └── ai.md
├── backend/                    # Express Node.js application
│   ├── server.ts               # Main entrypoint (Port 5002)
│   ├── prisma/                 # Prisma configuration & seed scripts
│   └── src/
│       ├── db/                 # Database initialization
│       ├── middleware/         # Auth verification guards
│       └── routes/             # Controller routes
└── frontend/                   # Vite React 19 application
    ├── vite.config.ts          # Vite bundle configuration (Port 5173)
    ├── tsconfig.json           # TS rules
    └── src/
        ├── App.tsx             # Route maps
        ├── index.css           # Global HSL themes & Tailwind v4 imports
        ├── api/                # API Client services (pointing to port 5002)
        ├── components/         # Reusable layouts & modals
        ├── store/              # Zustand Auth store
        └── pages/              # Primary view layouts
```

---

## 🛠️ Development commands

### Database Management
* Start local PostgreSQL (Port `5433` socket): `./run_db.sh start`
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
Our application follows the visual aesthetics of Apple Wallet, Notion, Stripe, and Linear.
* **Colors**: Pure monochromes (Black, White) paired with emerald accents (`#17C964` / green tags) and ruby warning elements (`#FF4D4F` / red tags).
* **Typography**: Clean *Inter* for system controls, labels, and statistics. Bold *Source Serif 4 Italic* solely for branding logos (`antigravity.`) and semantic callouts.
* **Layouts**: Thick rounded bounds (Cards: `22px`, inputs/buttons: `18px`), soft ambient shadows, spacious paddings, and glassmorphic modal backdrops.
* **Animations**: Fluid spring layouts powered by `framer-motion`.

---

## 🔗 Related Resources
* Read [[CODEX.md]] for system specifications and Prisma structures.
* Read [[AGENTS.md]] for commit message conventions and code checklists.
* Visit [[wiki/database]] for visual tables mappings.
