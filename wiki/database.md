# Database Wiki
Last Updated: 2026-07-05

This document details the schema definitions, relational keys, and data tables utilized in the Personal Expense Tracker.

---

## 🗄️ Core Tables & Models
Our database schema is defined in `backend/prisma/schema.prisma` and contains the following entities:

### 1. User
* **Fields**: `id`, `name`, `email`, `passwordHash`, `currency`, `createdAt`, `updatedAt`
* **Relations**: One-to-many with `Transaction`, `Budget`, `Goal`, `CreditCard`, `Bill`, `Subscription`, `Wallet`

### 2. Transaction
* **Fields**: `id`, `title`, `amount` (`Decimal`), `type` (`EXPENSE` | `INCOME`), `date`, `paymentMethod`, `tags` (`String[]`), `notes`, `location`, `attachmentUrl`, `receiptUrl`, `isRecurring`
* **Foreign Keys**: `userId` (connects to User), `categoryId` (connects to Category), `walletId` (connects to Wallet)

### 3. Category
* **Fields**: `id`, `name`, `color`, `icon`, `type` (`EXPENSE` | `INCOME`), `userId` (null if system-default)
* **Relations**: Protected against cascading deletes if transactions or budgets exist referencing the category.

### 4. Group & Shared Expenses
* **Group**: Shared ledgers created by `createdBy` User, linking many-to-many members via connection tables.
* **GroupExpense**: Split ledgers referencing `paidById` and `groupId`, mapping split ratios across `GroupExpenseSplit` entities.

---

## 🔗 Related Resources
* Read [[CODEX.md]] for standards.
* Read [[CLAUDE.md]] for commands.
