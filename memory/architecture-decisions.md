# Architecture Decisions (ADR)
Last Updated: 2026-07-19

This log tracks architectural decisions made during development.

---

## ADR 1: Local PostgreSQL Port Workaround
* **Status**: Accepted
* **Context**: Standard PostgreSQL port is `5432`. However, local environments may run standard instances.
* **Decision**: We initialized the local cluster using port `5433` inside the repository-scoped directory `postgres_data/` with trust authentication to bypass permission bottlenecks.

---

## ADR 2: Express Server Port Re-mapping to 5002
* **Status**: Accepted
* **Context**: Standard backend server runs on `5000`. However, macOS AirPlay Receiver listens on port `5000` by default, causing `EADDRINUSE` errors on startup.
* **Decision**: Shifted Express backend listen port to `5002`, and updated frontend environment variables accordingly.

---

## ADR 3: Relational Type-casting (any)
* **Status**: Accepted
* **Context**: Prisma Client types dynamically generated from the schema do not natively expose relations (like `transaction.category.name`) when base queries are performed.
* **Decision**: Cast return payloads to `any` at the controller layer when resolving relational objects, ensuring clean client responses without compiler errors.

---

## ADR 4: AI-Native Knowledge Base
* **Status**: Accepted
* **Context**: LLM session context loading suffers from token bloat and lack of persistent memory of codebase structure and priorities, forcing models to read raw source files repetitively.
* **Decision**: Adopt Andrej Karpathy's LLM Wiki layout (root index manuals, compact `/wiki` files) coupled with an Obsidian-style `/knowledge` vault of linked notes and a `/memory` state folder. Future AI sessions must load this documentation layer before touching source code, ensuring context-efficient sessions.

---

## 🔗 Related Resources
* Read [[CODEX.md]] for standards.
* Read [[current-status.md]] for status.
