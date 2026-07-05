# Coding Conventions
Last Updated: 2026-07-05

Our project coding guidelines enforce a high-quality visual style and clean code patterns.

---

## 🎨 Visual Styling & CSS
* **Themes**: Manage colors strictly via CSS custom properties (`--bg`, `--card`, `--text`, `--border`) based on HSL color ranges.
* **Component Classes**: Prefer semantic component classes (e.g. `.premium-card`, `.btn-premium`) to avoid ad-hoc Tailwind styling bloat.
* **Fonts**: Branding uses bold *Source Serif 4 Italic* (`font-serif italic`). All text, labels, and statistics use *Inter* (`font-sans`).

---

## 💻 TypeScript & APIs
* **Type Casting**: In API routers, cast route and query parameter identifiers to `as string` (e.g., `req.params.id as string`) when used in queries to satisfy Prisma strict parameters.
* **Strict Checks**: Write code compatible with `strict: true` flags. Avoid arbitrary `any` annotations unless resolving Prisma relational inclusion objects.
* **Controllers**: Return structured JSON error messages matching: `{ error: "Error message details" }`.

---

## 🔗 Related Resources
* Read [[CODEX.md]] for standards.
