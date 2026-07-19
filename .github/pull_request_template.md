## 📝 Summary
Provide a clear description of the problem solved, and the proposed changes implemented.

## 🎯 Type of Change
- [ ] Bug fix (non-breaking change resolving an issue)
- [ ] Feature implementation (non-breaking change adding features)
- [ ] Breaking change (change that would cause existing features to fail)
- [ ] Documentation update

## 🛡️ Security Scoping Check
- [ ] Verified that all Prisma/SQL database calls scope records strictly by `userId` or `workspaceId` (preventing leaks).
- [ ] Ensured inputs are validated using `express-validator` and properly sanitized.

## 🧪 Testing and Verification
Describe the tests you ran to verify your changes.
- [ ] Frontend Vite build succeeded (`npm run build --prefix frontend`)
- [ ] Backend Express TypeScript validation passed (`npx tsc --noEmit --project backend/tsconfig.json`)

## 📚 Checklist
- [ ] Checked that code follows the repository style guides.
- [ ] Synced technical changes to corresponding `/wiki` files and `/memory` logs.
- [ ] Verified backward compatibility holds.
