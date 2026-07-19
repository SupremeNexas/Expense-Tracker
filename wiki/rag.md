# Retrieval-Augmented Generation (RAG) Wiki

Last Updated: 2026-07-19

This wiki page outlines the design and privacy conventions of the RAG pipeline used by the AI Financial Assistant to answer natural language questions.

---

## 🔒 Privacy-First RAG Flow

To protect sensitive records and prevent API context token bloat, the assistant avoids sending the entire database to the LLM. Instead, it utilizes a two-step query synthesis.

```text
User Question  -->  [Intent Detection]  -->  Extract JSON Filters
                                                     ↓
Conversational <--  [Context Explainer] <--  Query Prisma DB
```

### Step 1: Intent & Filter Detection
The user query is first sent to the LLM with instructions to classify it into specific database search filters:
```json
{
  "category": "Food",
  "merchant": "McDonalds",
  "dateRange": "this-month",
  "limit": 10,
  "type": "EXPENSE"
}
```

### Step 2: Safe Scoped Database Query
The backend parses the JSON filters and executes a type-safe query using Prisma Client. 
*   **Strict Security Scope**: All queries are strictly appended with `where: { userId: req.user.id }`.
*   **Context Builder**: Retrieved rows are formatted into a minified, lightweight text block and fed back to the LLM to generate a conversational explanation.

---

## 💡 Natural Language Query Mapping

The RAG engine supports dynamic query intents:
*   *Query*: "Where did I spend the most this month?"  
    *Result*: Extracts `limit: 1`, `dateRange: "this-month"`, and sorts by amount to isolate the peak debit.
*   *Query*: "How much have I spent on food this year?"  
    *Result*: Filters by `category: "Food"`, `dateRange: "this-year"`.
*   *Query*: "Show all Amazon purchases."  
    *Result*: Filters by `merchant: "Amazon"`.

---

## 🔗 Related Resources
*   Read [[wiki/ai-architecture]] for module overview.
*   Read [[wiki/prompt-library]] for templates cataloging.
