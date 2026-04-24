# Full-Stack Expense Tracker

A modern, responsive, full-stack expense tracker built with React (Frontend) and Node.js + Express + SQLite (Backend). 

## Features
- **Dashboard**: High-level summary of your spending, recent transactions, and a 6-month trend chart.
- **Expenses Management**: Full CRUD capabilities for tracking expenses.
- **Category Management**: Customize spending categories with a selection of 16 preset colors and 17 icons. (Protected against deletion if in use).
- **Budgets**: Set up monthly or weekly budgets per category. Visual progress bars show you exactly how close you are to your limit.
- **Analytics Dashboard**: Deep dive into spending patterns with pie charts (spending by category), area charts (6-month trends), and bar charts (budget vs actual comparison).

## Technology Stack
- **Frontend**: React 18, Vite, React Router DOM, Recharts (for data visualization), Lucide React (for icons)
- **Backend**: Node.js, Express, better-sqlite3 (Zero-config SQLite database), express-validator
- **Styling**: Vanilla CSS with a custom-built premium dark theme featuring glassmorphism and smooth micro-animations.

## Quick Start (Local Development)

### 1. Start the Backend
The backend runs on `http://localhost:5000` and uses an embedded SQLite database. No database installation is required!

```bash
cd backend
npm install
npm start
```

### 2. Start the Frontend
The frontend uses Vite and proxies API requests to the backend automatically.

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.
