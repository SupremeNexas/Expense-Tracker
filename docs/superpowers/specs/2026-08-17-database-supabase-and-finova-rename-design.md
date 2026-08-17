# Spec: Supabase Integration & Finova Rebranding

**Product:** Finova — AI-native personal finance platform
**Version:** 1.1
**Date:** 2026-08-17
**Status:** Approved

---

## 1. Executive Summary

This specification outlines the transition of the application from a local database infrastructure to a production database hosted on Supabase, the deployment configurations for Render (backend) and Vercel (frontend), and the global rebranding from **Expense Tracker** to **Finova**.

---

## 2. Goals & Non-Goals

### Goals
- **G1. Supabase Postgres Migration** — Move the application's PostgreSQL database to Supabase using connection pooling for server operations and direct connections for schema management.
- **G2. Production Environment Readiness** — Align CORS, security flags, and dependency installations on Render and Vercel.
- **G3. Google OAuth Alignment** — Confirm that the Google Sign-in flow (GSI) operates properly on production origins without requiring server-side callback redirects.
- **G4. Rebranding Rename** — Systematically rename all instances of "Expense Tracker" to "Finova" across frontend, backend, package files, metadata, and robots.txt.

### Non-Goals
- Migrating database records from local PostgreSQL port 5433 to Supabase (Supabase database starts fresh; initial defaults are seeded via the idempotent client seeder).
- Changing backend hosting away from Render or frontend hosting away from Vercel.
- Implementing new finance or AI feature sets during this rebranding phase.

---

## 3. Database Connection Architecture

To handle server scalability while allowing safe schema updates with Prisma ORM, we implement a split-connection approach:

1. **`DATABASE_URL` (Pooled Connection)**
   * **Target:** Supabase Transaction Pooler (Port 6543) using parameters like `?pgbouncer=true` if using PGBouncer, or standard pooler parameters under Supavisor.
   * **Usage:** Applied by Express backend at runtime.
2. **`DIRECT_URL` (Direct Connection)**
   * **Target:** Supabase Direct PostgreSQL connection (Port 5432).
   * **Usage:** Used by CLI migration tools (e.g. `npx prisma db push`, `db seed`).

### Schema Configuration Update (`backend/prisma/schema.prisma`):
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 4. Production Security Architecture

### Secret Management
* All API keys, secrets, and database credentials must be configured strictly via hosting provider consoles (Render / Vercel dashboard).
* No `.env` files are committed to version control. Let's ensure `.env` matches rules in `.gitignore`.

### CORS Hardening
* The backend (`backend/server.ts`) restricts requests to coordinates within the allowlist `ALLOWED_ORIGINS`:
  - `process.env.CLIENT_URL` (dynamic production origin)
  - `http://localhost:5173` (development workspace)
  - `http://localhost:4173` (testing workspace)

### JWT Configuration
* Production signing uses `JWT_SECRET` configured via environment variables.

### Error Handling
* Express uses custom error-handling middleware (`backend/src/middleware/error.ts`) which logs errors internally and outputs sanitized JSON payloads to production users without leaking raw code lines, directory locations, or database traces.

---

## 5. Renaming Map ("Expense Tracker" ➔ "Finova")

The rename is executed across these target locations with case-appropriate branding names:

| File path | Target String | New String |
|---|---|---|
| `frontend/src/hooks/usePageTitle.ts:5` | `Expense Tracker` | `Finova` |
| `frontend/src/pages/LandingPage.tsx:357` | `Expense Tracker` | `Finova` |
| `frontend/src/pages/LandingPage.tsx:537, 559, 757, 762` | `Expense Tracker` | `Finova` |
| `frontend/src/pages/Nexova404Page.tsx:204-205` | `Expense Tracker` | `Finova` |
| `frontend/src/pages/AuthPage.tsx:222` | `Sign in to Expense Tracker` | `Sign in to Finova` |
| `frontend/src/pages/PrivacyPage.tsx:67` | `legal@expense-tracker.example.com` | `legal@finova.example.com` |
| `frontend/src/pages/PrivacyPage.tsx:73` | `Expense Tracker Security Group` | `Finova Security Group` |
| `frontend/index.html:12` | `Expense Tracker - Keep track...` | `Finova - Keep track...` |
| `frontend/index.html:19, 26` | `Expense Tracker - Unified Financial Ledger` | `Finova - Unified Financial Ledger` |
| `frontend/index.html:66` | `<title>Expense Tracker</title>` | `<title>Finova</title>` |
| `frontend/index.html:sitemaps` | `https://expense-tracker.example.com` | `https://finova.example.com` |
| `frontend/public/robots.txt:19` | `https://expense-tracker.example.com/sitemap.xml` | `https://finova.example.com/sitemap.xml` |
| `backend/package.json:2` | `"name": "expense-tracker-backend"` | `"name": "finova-backend"` |
| `backend/package.json:4` | `"description": "Expense Tracker REST API..."` | `"description": "Finova REST API..."` |
| `backend/server.ts:126` | `Fintech Expense Tracker API` | `Fintech Finova API` |

---

## 6. Verification Checklist

1. **Database Schema:** Confirm `npx prisma db push` resolves without error. Check that all 22 tables are successfully initialized in Supabase.
2. **Idempotent Seed:** Verify default workspace elements and core categories are written to Supabase through `npm run db:seed`.
3. **Local App Integration Check:** Point local development to Supabase connections in `.env` (temporarily, without committing) to make sure auth services and dashboard reads are operational.
4. **Build System:** Verification of backend setup file outputs and dependency building.
