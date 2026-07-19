# antigravity Personal Finance & Expense Tracker

A premium, AI-native Personal Finance and Expense Tracker built with React 19, Node.js Express, TypeScript, and PostgreSQL. It features account tracking, transaction categories, budgets, calendar bills, savings goals, split-expense shared groups, Google GSI Sign-In, and AI integrations (multimodal receipt vision scans and conversational coaching).

---

## 🎨 Design System & Aesthetics
Designed with a premium monochromatic aesthetic inspired by Apple Wallet, Notion, Stripe, and Linear:
* **Typography**: Elegant *Inter* for interfaces and metrics; *Source Serif 4 Italic* for branding (`antigravity.`).
* **Visuals**: Frameless glassmorphic modals with `10px` backdrop-blur, rounded bounds (`22px` cards, `18px` inputs), fluid spring animations using `framer-motion`, and custom HSL color variables.

---

## 🛠️ Technology Stack
* **Frontend**: React 19 SPA, Vite, TypeScript, Zustand, TanStack React Query, TailwindCSS v4, Recharts, Lucide Icons.
* **Backend**: Node.js Express, TypeScript, Prisma ORM, express-validator, google-auth-library.
* **Database**: PostgreSQL (Unix socket directory remapped locally to `/tmp` on port `5433`).
* **AI Engine**: Google Gemini API (`gemini-2.5-flash` model) via the `@google/genai` client.

---

## 🚀 Getting Started (Local Development)

Follow these steps to set up and run the application locally:

### Prerequisites
* **Node.js** (v18+)
* **Docker** or a local **PostgreSQL** database service
* **Google API Key** (optional, for Gemini AI receipt scanning features)
* **Google OAuth Credentials** (optional, for Google GSI Sign-In)

---

### Step 1: Initialize the Local PostgreSQL Database
We run PostgreSQL on port `5433` (socket `/tmp`) inside the workspace to avoid conflicts with other local databases:
```bash
# Start the local Docker PostgreSQL database container
./run_db.sh start
```

---

### Step 2: Configure and Run the Backend Server
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Set up your environment variables. Copy the example file:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to supply your `JWT_SECRET` and optional `GEMINI_API_KEY` or `GOOGLE_CLIENT_ID` values.
3. Synchronize database tables and run the seed script to create the demo profile (`demo@example.com` / `password123`):
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
4. Start the Express development server (running on port `5002`):
   ```bash
   npm run dev
   ```

---

### Step 3: Configure and Run the Frontend Client
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
2. Copy the environment variables example file:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Enter your `VITE_GOOGLE_CLIENT_ID` inside `.env`.
3. Start the Vite React development server (running on port `5173`):
   ```bash
   npm run dev
   ```

Open your browser and navigate to `http://localhost:5173` to access the application. Log in with the seeded credentials:
* **Email**: `demo@example.com`
* **Password**: `password123`

---

## 🗄️ Database Mappings (Prisma Schema)
The database structure is managed via Prisma. Check [[wiki/database]] or read `backend/prisma/schema.prisma` for full model listings:
* **User & Settings**: One-to-one mapping for settings preferences.
* **Wallets & Cards**: Financial asset channels (Cash, Bank, UPI, Credit Cards).
* **Transactions & Budgets**: Spent allocations and limits.
* **Recurring Transactions, Subscriptions & Bills**: Automated calendars burn gauges.
* **Savings Goals & Contributions**: Progress targets tracking.
* **Shared Expense Groups**: Multi-user cooperative ledger splits and settlements.

---

## 🌐 Production Deployments
The application is pre-configured for automated production deployments:
* **Frontend Vercel**: Configurations reside in `frontend/vercel.json` (proxies `/api` paths to the Render backend).
* **Backend Render**: Service specifications are declared in the root `render.yaml` orchestration profile.
* **Parity**: Relative API paths are resolved automatically in production to guarantee API proxy compatibility.

---

## ⚠️ Troubleshooting & FAQ

### macOS Port Conflict (EADDRINUSE 5000)
* **Problem**: macOS AirPlay Receiver blocks the default Express port `5000`.
* **Solution**: The server is pre-configured to run on Port `5002` instead. If you must run on port `5000`, go to macOS System Settings -> General -> Sharing and toggle off AirPlay Receiver.

### Database Connection Refused
* **Problem**: Backend fails to query PostgreSQL on port `5433`.
* **Solution**: Verify the Docker service is running, and re-execute `./run_db.sh start` in the workspace root.
