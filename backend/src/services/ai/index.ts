export * from './types';
export { getAIProvider, GeminiProvider } from './provider';
export { executeRAGQuery } from './rag';
export { getUserMemoryProfile } from './memory';
export { 
  generateSpendingInsights,
  detectSubscriptions,
  generateBudgetRecommendations,
  generateSpendingForecast,
  calculateFinancialHealthScore
} from './coach';

export { AIService } from './ai.service';
export { IntentService } from './intent.service';
export { QueryService } from './query.service';
export { AnalysisService } from './analysis.service';
export { ResponseService } from './response.service';
