# Deployment Guide
Last Updated: 2026-07-19

This document details the configuration for local Docker PostgreSQL databases and production hosting configurations (Render).

---

## 🏗️ Local Database Startup (`run_db.sh`)
For local developer setups, database engines are containerized using Docker:
* **Script**: `run_db.sh` runs commands to start/stop the local PostgreSQL database:
  - **Start**: Runs a Docker PostgreSQL container mapped to Port `5433` (redirecting socket outputs to `/tmp`), saving configurations in `postgres_data/`.
  - **Stop**: Halts the active Docker PostgreSQL container.
* **Commands**:
  ```bash
  ./run_db.sh start
  ./run_db.sh stop
  ```

---

## 🌐 Production Deployments Configuration (`render.yaml`)
The project includes a `render.yaml` file to automate multi-service hosting on Render:
* **Database**: Spins up a managed PostgreSQL instance.
* **Backend REST API**: Builds the Express server from the `backend/` directory, exposing port `5002` (configured via env variables).
* **Frontend Web App**: Hosts the Vite React compiled static assets from the `frontend/` directory.

```yaml
services:
  - type: web
    name: expense-tracker-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
  - type: web
    name: expense-tracker-frontend
    env: static
    buildCommand: npm install && npm run build
    publishPath: ./dist
```

---

## 🔒 Production Environment Checklist
Before deploying, ensure the following variables are configured in the dashboard:
1. `DATABASE_URL`: Production PostgreSQL connection string.
2. `JWT_SECRET`: High-entropy string for JWT tokens.
3. `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Client keys for Google Sign-In verification.
4. `CLIENT_URL`: Point to the frontend URL to allow CORS headers validation.
5. `GEMINI_API_KEY`: API key for OCR scanning.

---

## 🔗 Related Resources
* Read [[CLAUDE.md]] for development CLI.
* Read [[CODEX.md]] for environment variables.
