# AGENTS.md

This document defines the behavioral conventions, execution workflows, and review checklists for AI coding assistants (e.g. Antigravity, Claude Code, Cursor) collaborating on this codebase.

---

## 🚀 Session Initialization Sequence
Every AI session must start by reading the following index files before writing code:
```text
1. Read [[CLAUDE.md]]       # Command references & layout
2. Read [[CODEX.md]]        # Code standards & systems
3. Read [[AGENTS.md]]       # This rules file
4. Read `memory/current-status.md` & `current-priorities.md`
5. Load only the specific, related wiki page (e.g. `wiki/database.md`)
```

---

## 🎯 Context Loading Strategy
To prevent token bloat and context confusion, **do not load the entire repository**. Instead, determine which subsystem you are modifying and load only the required files.

* **Authentication changes**: Load `CLAUDE.md`, `CODEX.md`, `wiki/authentication.md`, and `memory/current-status.md`.
* **Database changes**: Load `CLAUDE.md`, `CODEX.md`, `wiki/database.md`, and `memory/current-status.md`.
* **Analytics/Dashboard changes**: Load `CLAUDE.md`, `wiki/analytics.md`, `wiki/dashboard.md`, and `memory/current-status.md`.
* **AI Feature changes**: Load `CLAUDE.md`, `wiki/ai.md`, and `memory/current-status.md`.

---

## 📝 Commit & Git Conventions
We follow the conventional commit specification for all repository commits.
* **Format**: `<type>(<scope>): <short description>`
* **Types**:
  * `feat`: A new feature implementation (e.g. `feat(ai): integrate gemini receipt scanner`)
  * `fix`: A bug fix (e.g. `fix(auth): solve refresh token expiration fallback`)
  * `docs`: Documentation updates only (e.g. `docs(wiki): record analytics schema details`)
  * `style`: Styling changes that do not affect code logic (e.g. `style(css): adjust button corner radius`)
  * `refactor`: Code changes that neither fix bugs nor add features (e.g. `refactor(routes): cast parameters`)
  * `chore`: Maintenance tasks (e.g. `chore(deps): update prisma client`)

---

## 🔍 Code Review & Refactoring Checklist
Before ending a session or proposing a pull request, run this checklist:
* [ ] **Compilation**: Run compiler checks (`tsc --noEmit` and Vite `npm run build`) to ensure `0` errors.
* [ ] **Preserve Comments**: Keep existing comments, notes, and JSDoc strings intact unless explicitly asked to modify them.
* [ ] **Strict scoping**: Verify all database calls scope records by `userId: req.user.id`.
* [ ] **Error Handling**: Wrap controller queries in standard `try-catch` structures with proper `500` status returns.
* [ ] **Documentation Update**: Sync changes to `/memory/completed-features.md`, `/memory/current-status.md`, and the wiki.

---

## 🔗 Related Resources
* Read [[CLAUDE.md]] for commands and structures.
* Read [[CODEX.md]] for system manuals.
