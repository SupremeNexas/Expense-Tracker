# Finova Main Deployment Checklist

- [x] Inspect git status, branch, remote, recent commits, workflows, and build config.
- [x] Run local backend and frontend CI checks.
- [ ] Commit legitimate uncommitted Finova changes without credentials.
- [ ] Push current work to `main` without force pushing.
- [ ] Monitor GitHub Actions for the latest `main` commit.
- [ ] Fix, commit, and push any root-cause CI failures until green.
- [ ] Report final commit hash, Actions status, changed files, and manual actions.
