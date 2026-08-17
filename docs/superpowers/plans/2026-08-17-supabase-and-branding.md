# Supabase Integration & Finova Rebranding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the database layer to Supabase PostgreSQL (via connection pooling for runtime, and direct connection for migrations) and rename the entire application to "Finova".

**Architecture:** Modify the Prisma client configuration in `schema.prisma` to add directUrl and pooled database sources. Apply the schema push directly to Supabase via direct URL port 5432, run seeds, verify schema tables, and execute a global search & replace for rebranding.

**Tech Stack:** React 19 · Vite · tsx · Express · Tailwind V4 · PostgreSQL · Prisma ORM 5.x

## Global Constraints
- Do not commit any `.env` files or expose database passwords.
- No uncontrolled registration attempts against the production database during verification.
- Always use pooled database URLs for API servers and direct database URLs for Prisma migrate/db push commands.
- For GSI Google Sign-In, Authorized JavaScript Origins must cover production frontend URLs, and no backend Redirect URIs are required.
- Do not change the backend hosting provider (Render) or the frontend hosting provider (Vercel).

---

## Technical File Impact Map

* **Backend DB Configuration:**
  - Modify: `backend/prisma/schema.prisma` (Add `directUrl` pointing to unpooled connection)
* **Backend Build & Env Config:**
  - Modify: `backend/server.ts` (Update startup server name in logs)
  - Modify: `backend/package.json` (Rebrand server project name to `finova-backend`)
  - Modify: `backend/package-lock.json` (Match name change)
  - Modify: `render.yaml` (Audit and update build and start commands for Render)
* **Frontend Web App Config:**
  - Modify: `frontend/index.html` (Rewrite title, description, keywords, OpenGraph URLs, JSON-LD metadata, and sitemaps)
  - Modify: `frontend/public/robots.txt` (Change sitemap URL)
  - Modify: `frontend/vercel.json` (Ensure api proxies point to fintech-expense-tracker-backend)
  - Modify: `frontend/src/hooks/usePageTitle.ts` (Change document title suffix)
  - Modify: `frontend/src/pages/LandingPage.tsx` (Rename copy text, labels, logos, and footer copyright)
  - Modify: `frontend/src/pages/Nexova404Page.tsx` (Rename navigation logos and text headers)
  - Modify: `frontend/src/pages/AuthPage.tsx` (Rename title card texts)
  - Modify: `frontend/src/pages/PrivacyPage.tsx` (Change support email domains and security department titles)

---

### Task 1: Update Prisma Datasource Configuration

Ensure Prisma is configured with both a connection pooler target URL (`DATABASE_URL`) and a direct migration connection URL (`DIRECT_URL`).

**Files:**
- Modify: `backend/prisma/schema.prisma:1-4`

**Interfaces:**
- Consumes: None
- Produces: Updated datasource block supporting double connections `url` and `directUrl`.

- [ ] **Step 1: Inspect first 5 lines of `backend/prisma/schema.prisma`**
- [ ] **Step 2: Modify `backend/prisma/schema.prisma` datasource block**
  Update the `db` block to:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
  ```
- [ ] **Step 3: Run Prisma Client generator**
  Run:
  ```bash
  cd backend && npx prisma generate
  ```
  Expected output: Prisma Client generated successfully.
- [ ] **Step 4: Commit changes**
  ```bash
  git add backend/prisma/schema.prisma
  git commit -m "feat(db): add directUrl to support Supabase connection pooling

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 2: Sync Schema & Seed Database to Supabase

Initialize backend schema and default settings on the Supabase database.

**Files:**
- Modify: none (Uses CLI operations on `backend/prisma/schema.prisma`)
- Verify: Supabase online database tables

**Interfaces:**
- Consumes: Prisma schema and direct connection parameters.
- Produces: 22 created tables and seeded default categories / scopes in the remote database.

- [ ] **Step 1: Securely verify local DATABASE_URL / DIRECT_URL connection parameters**
  (Without committing, check that env vars point to `fevridfibpruhreyucvn.supabase.co`)
- [ ] **Step 2: Sync Schema using Direct URL**
  Run:
  ```bash
  cd backend && npx prisma db push
  ```
  Expected output: Database synchronized successfully and columns updated.
- [ ] **Step 3: Seed initial database categories**
  Run:
  ```bash
  cd backend && npm run db:seed
  ```
  Expected output: Seed run successfully, default workspace data populated.
- [ ] **Step 4: Verify seed outputs**
  Confirm tables exist and are healthy.

---

### Task 3: Audit & Align Render / Vercel Configurations

Ensure build commands, runtime entrypoints, API proxies, and environment configurations are solid.

**Files:**
- Modify: `render.yaml`
- Modify: `frontend/vercel.json`

**Interfaces:**
- Consumes: None
- Produces: Corrected build commands and backend proxies.

- [ ] **Step 1: Audit and modify `render.yaml`**
  Ensure properties use `npm install && npx prisma generate` for build and `npm run start` for service execution.
  Modify the `render.yaml` to match:
  ```yaml
  services:
    - type: web
      name: fintech-expense-tracker-backend
      env: node
      plan: free
      buildCommand: cd backend && npm install && npx prisma generate
      startCommand: cd backend && npm run start
      envVars:
        - key: JWT_SECRET
          generateValue: true
        - key: PORT
          value: 5002
  ```
- [ ] **Step 2: Verify `frontend/vercel.json` configuration**
  Ensure Vercel rewrite configuration maps `/api/(.*)` destinations to the correct Render backend api URL.
- [ ] **Step 3: Commit changes**
  ```bash
  git add render.yaml frontend/vercel.json
  git commit -m "chore(config): optimize Render build setup and verify API rewrites

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 4: Global Brand Refactoring - Backend

Change naming references in the backend module from "Expense Tracker" to "Finova".

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Modify: `backend/server.ts`

**Interfaces:**
- Consumes: None
- Produces: Renamed package descriptors and print logs in backend modules.

- [ ] **Step 1: Modify `backend/package.json`**
  Rename `"name": "expense-tracker-backend"` to `"name": "finova-backend"`, and update the description.
- [ ] **Step 2: Modify `backend/package-lock.json`**
  Ensure package-lock package names match the dependency name update.
- [ ] **Step 3: Modify `backend/server.ts`**
  Change line 126 output log text:
  ```typescript
  console.log(`\n🚀 Fintech Finova API running at http://localhost:${PORT}`);
  ```
- [ ] **Step 4: Commit changes**
  ```bash
  git add backend/package.json backend/package-lock.json backend/server.ts
  git commit -m "chore(brand): rename backend package references to Finova

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 5: Global Brand Refactoring - Frontend (Part 1: Configs & Meta)

Rewrite site titles, HTML documents, description tags, search keywords, robots sitemaps, and hook helpers.

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/public/robots.txt`
- Modify: `frontend/src/hooks/usePageTitle.ts`

**Interfaces:**
- Consumes: None
- Produces: Updated document title headers and metadata layouts.

- [ ] **Step 1: Modify `frontend/index.html`**
  Update keywords, title tags (`<title>Finova</title>`), og:title, twitter:title, organization schema details, and example URLs.
- [ ] **Step 2: Modify `frontend/public/robots.txt`**
  Change site URL: `https://finova.example.com/sitemap.xml`
- [ ] **Step 3: Modify `frontend/src/hooks/usePageTitle.ts`**
  Change page format suffix line:
  ```typescript
  document.title = `${title} | Finova`;
  ```
- [ ] **Step 4: Commit changes**
  ```bash
  git add frontend/index.html frontend/public/robots.txt frontend/src/hooks/usePageTitle.ts
  git commit -m "chore(brand): rebrand HTML headers, sitemaps, and usePageTitle hook

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 6: Global Brand Refactoring - Frontend (Part 2: UI Pages)

Rewrite headings, footer copyright notices, legal notices, and navigation elements.

**Files:**
- Modify: `frontend/src/pages/LandingPage.tsx`
- Modify: `frontend/src/pages/Nexova404Page.tsx`
- Modify: `frontend/src/pages/AuthPage.tsx`
- Modify: `frontend/src/pages/PrivacyPage.tsx`

**Interfaces:**
- Consumes: `usePageTitle.ts` for title changes.
- Produces: Fully rebranded page layouts.

- [ ] **Step 1: Modify `frontend/src/pages/LandingPage.tsx`**
  Update Cinematic Scroll sections, Sight Slider layouts, copy paragraphs, buttons (`Open Finova`), FAQ references, and copyright links.
- [ ] **Step 2: Modify `frontend/src/pages/Nexova404Page.tsx`**
  Update navigation header elements (`alt="Finova"`, text `<span>Finova</span>`).
- [ ] **Step 3: Modify `frontend/src/pages/AuthPage.tsx`**
  Update heading cards: `Sign in to Finova`.
- [ ] **Step 4: Modify `frontend/src/pages/PrivacyPage.tsx`**
  Update legal coordinates, contact emails (`legal@finova.example.com`), and security team name (`Finova Security Group`).
- [ ] **Step 5: Run Vitest to verify brand changes**
  Test in terminal:
  ```bash
  cd frontend && npm run test
  ```
  Expected output: Test suite runs and passes cleanly.
- [ ] **Step 6: Commit changes**
  ```bash
  git add frontend/src/pages/LandingPage.tsx frontend/src/pages/Nexova404Page.tsx frontend/src/pages/AuthPage.tsx frontend/src/pages/PrivacyPage.tsx
  git commit -m "chore(brand): update page layouts, legal sections, and headers to Finova

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 7: Production Integrations Local Verification

Perform local client-server execution testing pointing to local/staging Supabase configurations.

**Files:**
- Verify: Local client compilation and API client routes.

- [ ] **Step 1: Test server boots locally**
  Start backend and verify Express database connections.
- [ ] **Step 2: Run frontend local client compile**
  Check that frontend is able to compile static assets correctly via `npm run build` from the `frontend/` directory. Check that there are no static build/TS faults.
