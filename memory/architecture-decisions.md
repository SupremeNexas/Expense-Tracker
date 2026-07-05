# Architecture Decisions (ADR)
Last Updated: 2026-07-05

This log tracks architectural decisions made during development.

---

## ADR 1: Local PostgreSQL Port Workaround
* **Status**: Accepted
* **Context**: The standard PostgreSQL port is `5432`. However, local user environments may have a pre-existing server or permission limits on `5432`.
* **Decision**: We initialized the local cluster using port `5433` inside the repository-scoped directory `postgres_data/` with trust authentication to bypass permission bottlenecks.

---

## ADR 2: Express Server Port Re-mapping to 5002
* **Status**: Accepted
* **Context**: Standard backend server runs on `5000`. However, macOS services (Control Center/AirPlay Receiver) listen on port `5000` by default, causing `EADDRINUSE` errors on startup.
* **Decision**: Shifted Express backend listen port to `5002`, and updated the Vite configuration proxy settings accordingly.

---

## ADR 3: Relational Type-casting (any)
* **Status**: Accepted
* **Context**: Prisma Client types dynamically generated from the schema do not natively expose relations (like `transaction.category.name`) when base queries are performed.
* **Decision**: Cast return payloads to `any` at the controller layer when resolving relational objects, ensuring clean client responses without compiler errors.

---

## 🔗 Related Resources
* Read [[CODEX.md]] for standards.
* Read [[current-status.md]] for status.
