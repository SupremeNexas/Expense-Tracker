import { prisma } from '../../db/prisma';
import { IntentService } from './intent.service';
import { QueryService } from './query.service';
import { AnalysisService } from './analysis.service';
import { ResponseService, ChatResponse } from './response.service';

export class AIService {
  static async processChat(
    userId: string, 
    workspaceId: string, 
    message: string
  ): Promise<ChatResponse> {
    try {
      // 1. Fetch user workspace details (especially default base currency)
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      const userCurrency = user?.baseCurrency || 'USD';

      // 2. Detect query intent & filters
      console.log(`[AIService] Detecting intent for query: "${message}"`);
      const intent = await IntentService.detectIntent(message);
      console.log(`[AIService] Detected intent: ${intent.type} with filters:`, intent.filters);

      // 3. Execute database query securely scoped
      console.log(`[AIService] Fetching data for user: ${userId}, workspace: ${workspaceId}`);
      const queryResult = await QueryService.executeQuery(userId, workspaceId, intent);

      // 4. Calculate stats and aggregations
      console.log('[AIService] Analyzing records data...');
      const summary = AnalysisService.analyze(queryResult, intent);

      // 5. Generate LLM explanation and chart configurations
      console.log('[AIService] Constructing final grounded answer payload...');
      const response = await ResponseService.generateResponse(
        message,
        intent,
        summary,
        queryResult.transactions,
        userCurrency
      );

      return response;
    } catch (err) {
      console.error('[AIService] Failed to process conversational chat:', err);
      throw new Error('AI Assistant failed to compute answer. Please try again.');
    }
  }
}
export default AIService;
