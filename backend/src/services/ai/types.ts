export interface AIProvider {
  name: string;
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
  generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T>;
}

export interface CategorizationResult {
  category: string;
  confidence: number;
  reasoning?: string;
}

export interface SubscriptionResult {
  detected: boolean;
  name: string;
  amount: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  nextBillingDate: string;
  confidence: number;
  category: string;
}

export interface ForecastResult {
  monthEndEstimate: number;
  budgetOverrunPrediction: boolean;
  projectedSavings: number;
  expectedCashFlow: number;
  confidence: number; // 0 to 1
  reasoning: string;
}

export interface MetricDetail {
  name: string;
  value: string;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
}

export interface SuggestionDetail {
  category: string;
  text: string;
  impact: string;
}

export interface HealthScoreResult {
  score: number;
  metrics: MetricDetail[];
  suggestions: SuggestionDetail[];
}

export interface InsightResult {
  type: 'SPIKE' | 'TREND' | 'SAVINGS' | 'ANOMALY';
  title: string;
  text: string;
  category?: string;
  impactValue?: number;
}

export interface ReceiptResult {
  merchant: string;
  amount: number;
  tax: number;
  date: string;
  category: string;
  items: string[];
  confidence: number;
}

export interface RecommendationResult {
  category: string;
  averageSpend: number;
  recommendedLimit: number;
  reasoning: string;
}

// RAG Intent details
export interface RAGFilters {
  category?: string;
  merchant?: string;
  dateRange?: 'this-month' | 'last-month' | 'this-year' | 'last-year' | 'all';
  limit?: number;
  type?: 'EXPENSE' | 'INCOME';
}
