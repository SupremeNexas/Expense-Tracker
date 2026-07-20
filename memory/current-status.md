# Current Status
Last Updated: 2026-07-20

The Personal Finance and Expense Tracker repository is production-ready and publicly released as **v1.0.0**.

---

## 🚀 Running Instances
* **Backend REST API**: Active on port `5002`
* **Database**: Local PostgreSQL cluster active on port `5433`
* **Frontend client**: Vite React dev server active on port `5173`

---

## ✅ v1.0.0 Release Summary

| Area | Status | Notes |
| :--- | :--- | :--- |
| Authentication (email + Google OAuth) | ✅ Complete | JWT + silent refresh token rotation |
| Dashboard | ✅ Complete | Balance, transactions, sparklines, budgets |
| Transactions (CRUD) | ✅ Complete | Filters, tags, attachments, receipt OCR |
| Budgets | ✅ Complete | Category-scoped monthly/weekly limits |
| Savings Goals | ✅ Fixed & Complete | Route, create, and contribute all working |
| Credit Cards | ✅ Complete | Limit, due balance, billing cycle |
| Recurring Bills | ✅ Complete | Calendar with paid/unpaid tracking |
| Subscriptions | ✅ Complete | Monthly/yearly with renewal dates |
| Shared Groups | ✅ Complete | Split expenses and settlement tracking |
| AI Copilot | ✅ Complete | Gemini 2.5 Flash with mock fallback |
| Analytics | ✅ Complete | Category breakdown and trend charts |
| Workspace Settings | ✅ Complete | Multi-workspace with RBAC foundations |

---

## 🐛 Issues Fixed in v1.0.0
* `/goals` route was missing from `App.tsx` — GoalsPage showed 404
* Goal creation failed — frontend sent camelCase fields, backend validated snake_case
* `POST /goals/:id/contribute` endpoint was missing from backend — contribute always 404'd
* 1.6 MB monolithic JS bundle — Vite code splitting enabled
* `App.css` dead file removed (was not imported anywhere)
* `REFRESH_TOKEN_SECRET` missing from `backend/.env.example`
* README.md was thin — full open-source rewrite completed

---

## ⚠️ Known Limitations
* Google OAuth requires a configured `GOOGLE_CLIENT_ID` — Google Sign-In button is non-functional without it
* AI features require `GEMINI_API_KEY` — fallback mock responses are served when key is absent
* No email notification delivery (notifications are generated in DB but not dispatched)
* Automation rules engine is schema-ready but UI is not yet implemented

---

## 🔗 Related Resources
* Read [[CLAUDE.md]] for commands.
* Read [[CODEX.md]] for standards.
* Read [[memory/current-priorities.md]] for roadmap priorities.
