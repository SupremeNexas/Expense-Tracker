# Tool Invocation Rules (Project)

- This environment resolves tools **exactly**. Always emit tool names with the exact
  casing the harness advertises: `Bash`, `Read`, `Edit`, `Write`, `Skill`,
  `ToolSearch`, `Agent`, `AskUserQuestion`.
- **Never** emit lowercased tool names (`bash`, `read`, `edit`, `write`, `skill`).
  Lowercased names are not registered and fail with
  `Error: No such tool available: <name>`.
- If a tool call is rejected with "No such tool available", re-emit it with the exact
  advertised casing before trying anything else. Do not reinterpret the rule.
- The failure is at tool-call generation time — re-check the casing on every call,
  do not assume a prior fix carries over.