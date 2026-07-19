# 💸 Expense Tracker

> A modern personal finance platform built with React, TypeScript, Node.js, Express, PostgreSQL, and Prisma. Track expenses, manage budgets, monitor recurring bills, analyze spending habits, and explore AI-powered finance workflows through a production-ready interface.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-success)

## Live Demo

Website: https://expense-tracker-eight-pi-69.vercel.app

## Features

- Dashboard with balance, savings, trends, and recent activity
- Expense, budget, bill, goal, subscription, and credit card management
- Workspace and collaboration foundations
- AI copilot and analytics foundations
- Google sign-in support in the frontend
- AI-native repo docs with wiki, memory, and knowledge vaults

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- TanStack Query
- Framer Motion
- Recharts

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT-based auth

## Project Structure

```text
Expense-Tracker/
├── frontend/
├── backend/
├── wiki/
├── knowledge/
├── memory/
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- Docker or a local PostgreSQL instance
- Google OAuth credentials if you want Google sign-in
- Google AI credentials if you want AI-powered features

### 1. Clone the repository

```bash
git clone https://github.com/SupremeNexas/Expense-Tracker.git
cd Expense-Tracker
```

### 2. Start PostgreSQL

The local setup uses the bundled script and defaults to PostgreSQL on port `5433`.

```bash
./run_db.sh start
```

### 3. Configure and run the backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

The backend runs on `http://localhost:5002`.

### 4. Configure and run the frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Environment Variables

### Backend

```env
DATABASE_URL=
JWT_SECRET=
REFRESH_TOKEN_SECRET=
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=
PORT=5002
```

### Frontend

```env
VITE_API_URL=http://localhost:5002
VITE_GOOGLE_CLIENT_ID=
```

## Deployment Notes

- The frontend is configured for Vercel.
- The frontend proxies `/api/*` requests to the deployed backend URL defined in `frontend/vercel.json`.
- In production, Google sign-in also requires the correct Vercel domain in Google Cloud OAuth origins and the matching backend callback URL.

## Repository Docs

This repo includes:

- `CLAUDE.md`
- `CODEX.md`
- `AGENTS.md`
- `wiki/`
- `knowledge/`
- `memory/`

These documents are intended to reduce repeated context loading for future development sessions.
