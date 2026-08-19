---
name: strict-tool-casing
description: Enforce capitalized tool names (Bash, Read, Edit, Write)
metadata:
  type: feedback
---

Always use PascalCase tool names like `Bash`, `Read`, `Edit`, `Write`. Lowercase (`bash`, `read`) produces a runtime lookup error.

**Why:** The execution environment uses case-sensitive tool registries.
**How to apply:** Check tool identifier casing before emitting XML/JSON tool calls.
