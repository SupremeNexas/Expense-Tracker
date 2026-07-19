# Known Bugs & Gaps
Last Updated: 2026-07-19

This document tracks identified bugs, active issues, and UI discrepancies.

---

## ⚠️ High Priority

### 1. Missing `/api/expenses/wallets` Route
* **Description**: Frontend `ExpenseForm.tsx` performs a Query call to `/expenses/wallets` to fetch the list of user wallets. The backend router does not define this endpoint, causing a `404 Not Found` response.
* **Impact**: UI drops back to static payment method strings; wallets cannot be fetched dynamically from the database in the form.
* **Proposed Fix**: Add a GET route in `backend/src/routes/expenses.ts`:
  ```typescript
  router.get('/wallets', authenticate, async (req, res) => {
    try {
      const wallets = await prisma.wallet.findMany({ where: { userId: req.user.id } });
      res.json(wallets);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch wallets' });
    }
  });
  ```

---

## ℹ️ Low Priority

### 1. macOS Port Conflict (Port 5000)
* **Description**: AirPlay Receiver conflicts with Express default port `5000`.
* **Fix**: Shipped application to run on Port `5002` by default.

---

## 🔗 Related Resources
* Read [[memory/current-priorities.md]] for short-term priority fixes.
