# Authentication Wiki
Last Updated: 2026-07-05

This document details the security layers, password management, and authorization flows.

---

## 🔒 Security Lifecycle

### 1. Registration & Password Salting
* Passes incoming passwords through `bcryptjs.hash()` using `10` salt rounds.
* Encrypts and persists credentials in the `User` table.

### 2. JWT Access Tokens
* Generated during `/api/auth/login` containing the payload `{ id: user.id, email: user.email }`.
* Signed using `JWT_SECRET` (fallback: `f1nt3ch_53cr3t_2026_jwt_k3y`).
* Validated on protected endpoints via the `authenticate` middleware in `backend/src/middleware/auth.ts`.

### 3. Silent Refresh Token Rotation
* Long-lived tokens are tracked in `localStorage` as `fintech_refresh_token`.
* Exchanged silently when access tokens expire to maintain user sessions without disruptions.

---

## 🔗 Related Resources
* Read [[CODEX.md]] for standards.
* Read [[CLAUDE.md]] for commands.
