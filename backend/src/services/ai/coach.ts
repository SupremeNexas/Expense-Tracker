import { prisma } from '../../db/prisma';
import { getAIProvider } from './provider';
import { 
  InsightResult, 
  SubscriptionResult, 
  ForecastResult, 
  RecommendationResult, 
  HealthScoreResult 
} from './types';
import {
  INSIGHTS_SYSTEM_INSTRUCTION,
  getInsightsPrompt,
  SUBSCRIPTION_SYSTEM_INSTRUCTION,
  getSubscriptionPrompt,
  FORECAST_SYSTEM_INSTRUCTION,
  getForecastPrompt,
  RECOMMENDATIONS_SYSTEM_INSTRUCTION,
  getRecommendationsPrompt,
  HEALTH_SCORE_SYSTEM_INSTRUCTION,
  getHealthScorePrompt
} from './prompts';

/**
 * AI Spending Insights Generator
 */
export async function generateSpendingInsights(userId: string): Promise<InsightResult[]> {
  try {
    const provider = getAIProvider();
    
    // Fetch last 150 expenses
    const transactions = await prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE' },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 150
    });

    if (transactions.length === 0) {
      return [
        {
          type: 'TREND',
          title: 'Awaiting transactions logs',
          text: 'Add your transactions to trigger automated financial intelligence insights.'
        }
      ];
    }

    const dataContext = transactions.map(t => ({
      title: t.title,
      amount: Number(t.amount),
      category: t.category.name,
      date: t.date.toISOString().split('T')[0],
      day: t.date.getDay() // 0 = Sunday, 6 = Saturday
    }));

    const prompt = getInsightsPrompt(JSON.stringify(dataContext, null, 2));
    const insights = await provider.generateJSON<InsightResult[]>(prompt, INSIGHTS_SYSTEM_INSTRUCTION);
    
    return Array.isArray(insights) ? insights : [];
  } catch (err) {
    console.error('Error generating spending insights:', err);
    return [];
  }
}

/**
 * AI Subscription Payment Detector
 */
export async function detectSubscriptions(userId: string): Promise<SubscriptionResult[]> {
  try {
    const provider = getAIProvider();
    
    // Fetch user transaction history (last 200 items)
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 200
    });

    const dataContext = transactions.map(t => ({
      title: t.title,
      amount: Number(t.amount),
      type: t.type,
      category: t.category.name,
      date: t.date.toISOString().split('T')[0]
    }));

    const prompt = getSubscriptionPrompt(JSON.stringify(dataContext, null, 2));
    const subs = await provider.generateJSON<SubscriptionResult[]>(prompt, SUBSCRIPTION_SYSTEM_INSTRUCTION);
    
    return Array.isArray(subs) ? subs : [];
  } catch (err) {
    console.error('Error detecting subscriptions:', err);
    return [];
  }
}

/**
 * AI Budget Limits Recommendations
 */
export async function generateBudgetRecommendations(userId: string): Promise<RecommendationResult[]> {
  try {
    const provider = getAIProvider();

    // Fetch user category spends (grouping sum of amounts)
    const transactions = await prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE' },
      include: { category: true }
    });

    const categorySpends: Record<string, { total: number; count: number }> = {};
    for (const t of transactions) {
      const catName = t.category.name;
      if (!categorySpends[catName]) {
        categorySpends[catName] = { total: 0, count: 0 };
      }
      categorySpends[catName].total += Number(t.amount);
      categorySpends[catName].count++;
    }

    const dataContext = Object.entries(categorySpends).map(([cat, info]) => ({
      category: cat,
      totalSpend: info.total,
      averageSpend: Number((info.total / Math.max(1, info.count)).toFixed(2))
    }));

    const prompt = getRecommendationsPrompt(JSON.stringify(dataContext, null, 2));
    const recs = await provider.generateJSON<RecommendationResult[]>(prompt, RECOMMENDATIONS_SYSTEM_INSTRUCTION);

    return Array.isArray(recs) ? recs : [];
  } catch (err) {
    console.error('Error generating budget recommendations:', err);
    return [];
  }
}

/**
 * AI Month-End Spending Forecast
 */
export async function generateSpendingForecast(userId: string): Promise<ForecastResult> {
  try {
    const provider = getAIProvider();

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 100
    });

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true }
    });

    const transContext = transactions.map(t => ({
      amount: Number(t.amount),
      type: t.type,
      date: t.date.toISOString().split('T')[0]
    }));

    const budgetContext = budgets.map(b => ({
      category: b.category.name,
      limit: Number(b.amount)
    }));

    const prompt = getForecastPrompt(
      JSON.stringify(transContext, null, 2),
      JSON.stringify(budgetContext, null, 2)
    );

    return await provider.generateJSON<ForecastResult>(prompt, FORECAST_SYSTEM_INSTRUCTION);
  } catch (err) {
    console.error('Error generating spending forecast:', err);
    return {
      monthEndEstimate: 0,
      budgetOverrunPrediction: false,
      projectedSavings: 0,
      expectedCashFlow: 0,
      confidence: 0.5,
      reasoning: 'Fallback due to forecasting execution error.'
    };
  }
}

/**
 * AI Financial Health Score Calculator (Blends exact math and LLM suggestions)
 */
export async function calculateFinancialHealthScore(userId: string): Promise<HealthScoreResult> {
  try {
    const provider = getAIProvider();

    // 1. Gather numerical variables from the database for precise calculation
    const transactions = await prisma.transaction.findMany({
      where: { userId }
    });

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true }
    });

    // Calculate income and expenses
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlySurplus = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;

    // Calculate budget overruns
    let totalBudgets = 0;
    let violatedBudgets = 0;
    
    // Group expenses by category
    const expenseByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + Number(t.amount);
      });

    budgets.forEach(b => {
      totalBudgets++;
      const spent = expenseByCategory[b.categoryId] || 0;
      if (spent > Number(b.amount)) {
        violatedBudgets++;
      }
    });

    const budgetAdherence = totalBudgets > 0 ? ((totalBudgets - violatedBudgets) / totalBudgets) * 100 : 100;

    // 2. Feed precise numerical profile to LLM to receive advice and suggestions
    const metricsPayload = {
      totalIncome,
      totalExpense,
      monthlySurplus,
      savingsRate: `${savingsRate.toFixed(1)}%`,
      budgetAdherence: `${budgetAdherence.toFixed(1)}%`,
      activeBudgetsCount: totalBudgets,
      violatedBudgetsCount: violatedBudgets
    };

    const prompt = getHealthScorePrompt(JSON.stringify(metricsPayload, null, 2));
    const scoreResult = await provider.generateJSON<HealthScoreResult>(prompt, HEALTH_SCORE_SYSTEM_INSTRUCTION);

    return scoreResult;
  } catch (err) {
    console.error('Error calculating financial health score:', err);
    return {
      score: 70,
      metrics: [
        { name: 'Savings Rate', value: '0%', status: 'WARNING' },
        { name: 'Budget Adherence', value: '100%', status: 'GOOD' }
      ],
      suggestions: [
        { category: 'General', text: 'Error calculating complete health metrics profile. Verify logs.', impact: '₹0' }
      ]
    };
  }
}
