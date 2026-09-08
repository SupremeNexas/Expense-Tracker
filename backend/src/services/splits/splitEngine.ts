export interface SplitParticipantInput {
  userId: string;
  amount?: number;
  percentage?: number;
  shares?: number;
}

export interface CalculatedSplit {
  userId: string;
  amountOwed: number;
}

export interface SimplifiedTransfer {
  paidBy: string;
  paidByName?: string;
  paidTo: string;
  paidToName?: string;
  amount: number;
}

/**
 * Calculates exact cent splits for expenses based on split type.
 * Ensures total splits sum EXACTLY to the total expense amount without penny loss.
 */
export function calculateSplits(
  totalAmount: number,
  payerId: string,
  participants: string[],
  splitType: 'equal' | 'exact' | 'percentage' | 'shares',
  splitValues?: SplitParticipantInput[]
): CalculatedSplit[] {
  const roundedTotalCents = Math.round(totalAmount * 100);
  if (roundedTotalCents <= 0) {
    throw new Error('Total amount must be greater than zero');
  }

  if (!participants || participants.length === 0) {
    throw new Error('At least one participant is required');
  }

  if (splitType === 'equal') {
    const n = participants.length;
    const baseCentsPerPerson = Math.floor(roundedTotalCents / n);
    let remainderCents = roundedTotalCents - baseCentsPerPerson * n;

    return participants.map((userId, idx) => {
      // Add 1 extra cent to the first 'remainderCents' participants to reconcile exact sum
      const addCent = idx < remainderCents ? 1 : 0;
      const personCents = baseCentsPerPerson + addCent;
      return {
        userId,
        amountOwed: personCents / 100,
      };
    });
  }

  if (splitType === 'exact') {
    if (!splitValues || splitValues.length === 0) {
      throw new Error('Exact split values are required');
    }

    const splits: CalculatedSplit[] = splitValues.map((v) => ({
      userId: v.userId,
      amountOwed: Math.round(Number(v.amount || 0) * 100) / 100,
    }));

    const sumCents = splits.reduce((sum, s) => sum + Math.round(s.amountOwed * 100), 0);
    if (Math.abs(sumCents - roundedTotalCents) > 1) {
      throw new Error(
        `Exact splits sum (${(sumCents / 100).toFixed(2)}) must equal total amount (${totalAmount.toFixed(2)})`
      );
    }

    return splits;
  }

  if (splitType === 'percentage') {
    if (!splitValues || splitValues.length === 0) {
      throw new Error('Percentage split values are required');
    }

    const totalPct = splitValues.reduce((sum, v) => sum + Number(v.percentage || 0), 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new Error(`Percentages must sum to 100 (got ${totalPct}%)`);
    }

    let calculatedCentsSum = 0;
    const splits: CalculatedSplit[] = splitValues.map((v) => {
      const pct = Number(v.percentage || 0);
      const cents = Math.floor((roundedTotalCents * pct) / 100);
      calculatedCentsSum += cents;
      return {
        userId: v.userId,
        amountOwed: cents / 100,
      };
    });

    let remainderCents = roundedTotalCents - calculatedCentsSum;
    if (remainderCents > 0) {
      // Distribute remaining cents to largest percentage participants
      const sortedIndexes = [...splitValues.keys()].sort(
        (a, b) => Number(splitValues[b].percentage || 0) - Number(splitValues[a].percentage || 0)
      );

      for (let i = 0; i < remainderCents; i++) {
        const targetIdx = sortedIndexes[i % sortedIndexes.length];
        splits[targetIdx].amountOwed = Math.round((splits[targetIdx].amountOwed * 100 + 1)) / 100;
      }
    }

    return splits;
  }

  if (splitType === 'shares') {
    if (!splitValues || splitValues.length === 0) {
      throw new Error('Share split values are required');
    }

    const totalShares = splitValues.reduce((sum, v) => sum + Number(v.shares || 0), 0);
    if (totalShares <= 0) {
      throw new Error('Total shares must be greater than zero');
    }

    let calculatedCentsSum = 0;
    const splits: CalculatedSplit[] = splitValues.map((v) => {
      const shares = Number(v.shares || 0);
      const cents = Math.floor((roundedTotalCents * shares) / totalShares);
      calculatedCentsSum += cents;
      return {
        userId: v.userId,
        amountOwed: cents / 100,
      };
    });

    let remainderCents = roundedTotalCents - calculatedCentsSum;
    if (remainderCents > 0) {
      const sortedIndexes = [...splitValues.keys()].sort(
        (a, b) => Number(splitValues[b].shares || 0) - Number(splitValues[a].shares || 0)
      );

      for (let i = 0; i < remainderCents; i++) {
        const targetIdx = sortedIndexes[i % sortedIndexes.length];
        splits[targetIdx].amountOwed = Math.round((splits[targetIdx].amountOwed * 100 + 1)) / 100;
      }
    }

    return splits;
  }

  throw new Error(`Unsupported split type: ${splitType}`);
}

/**
 * Calculates net position for every member in a group.
 * Net position = (Paid Expenses - Expense Splits) + (Settlements Paid - Settlements Received)
 */
export function calculateNetPositions(
  members: Array<{ id: string; name: string }>,
  expenses: Array<{
    paidById: string;
    amount: number;
    splits: Array<{ userId: string; amountOwed: number }>;
  }>,
  settlements: Array<{
    paidById: string;
    paidToId: string;
    amount: number;
  }>
): Map<string, number> {
  const netMap = new Map<string, number>();

  members.forEach((m) => netMap.set(m.id, 0));

  // 1. Process Expenses
  for (const exp of expenses) {
    const payerId = exp.paidById;
    const totalAmountCents = Math.round(exp.amount * 100);

    // Payer gets credit for total expense amount
    if (netMap.has(payerId)) {
      netMap.set(payerId, netMap.get(payerId)! + totalAmountCents);
    }

    // Each participant gets debited their split amount
    for (const s of exp.splits) {
      const splitCents = Math.round(s.amountOwed * 100);
      if (netMap.has(s.userId)) {
        netMap.set(s.userId, netMap.get(s.userId)! - splitCents);
      }
    }
  }

  // 2. Process Settlements
  for (const set of settlements) {
    const payerCents = Math.round(set.amount * 100);

    // Payer settled debt -> net position increases (+ credit)
    if (netMap.has(set.paidById)) {
      netMap.set(set.paidById, netMap.get(set.paidById)! + payerCents);
    }

    // Payee received settlement -> net position decreases (- credit)
    if (netMap.has(set.paidToId)) {
      netMap.set(set.paidToId, netMap.get(set.paidToId)! - payerCents);
    }
  }

  // Convert cents back to rounded floats
  const result = new Map<string, number>();
  netMap.forEach((cents, userId) => {
    result.set(userId, cents / 100);
  });

  return result;
}

/**
 * Splitwise Debt Simplification Algorithm.
 * Minimizes the number of transfers required to settle all group debts.
 * Preserves exact cents and reconciles deterministically without touching historical transactions.
 */
export function simplifyGroupDebts(
  members: Array<{ id: string; name: string }>,
  expenses: Array<{
    paidById: string;
    amount: number;
    splits: Array<{ userId: string; amountOwed: number }>;
  }>,
  settlements: Array<{
    paidById: string;
    paidToId: string;
    amount: number;
  }>
): SimplifiedTransfer[] {
  const memberMap = new Map<string, string>();
  members.forEach((m) => memberMap.set(m.id, m.name));

  const netPositions = calculateNetPositions(members, expenses, settlements);

  // Separate debtors (< 0) and creditors (> 0) in integer cents
  const debtors: Array<{ userId: string; cents: number }> = [];
  const creditors: Array<{ userId: string; cents: number }> = [];

  netPositions.forEach((amount, userId) => {
    const cents = Math.round(amount * 100);
    if (cents < 0) {
      debtors.push({ userId, cents: Math.abs(cents) });
    } else if (cents > 0) {
      creditors.push({ userId, cents });
    }
  });

  // Sort deterministically: highest amount first, then by userId string
  debtors.sort((a, b) => b.cents - a.cents || a.userId.localeCompare(b.userId));
  creditors.sort((a, b) => b.cents - a.cents || a.userId.localeCompare(b.userId));

  const simplified: SimplifiedTransfer[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const transferCents = Math.min(debtor.cents, creditor.cents);
    if (transferCents > 0) {
      simplified.push({
        paidBy: debtor.userId,
        paidByName: memberMap.get(debtor.userId) || 'Member',
        paidTo: creditor.userId,
        paidToName: memberMap.get(creditor.userId) || 'Member',
        amount: transferCents / 100,
      });

      debtor.cents -= transferCents;
      creditor.cents -= transferCents;
    }

    if (debtor.cents === 0) dIdx++;
    if (creditor.cents === 0) cIdx++;
  }

  return simplified;
}
