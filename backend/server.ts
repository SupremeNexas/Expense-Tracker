import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authenticate } from './src/middleware/auth';
import { errorHandler } from './src/middleware/error';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// ── CORS — only allow our configured frontend origin ──────────────────────────
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',  // Always allow dev
  'http://localhost:4173',  // Vite preview
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Import route modules
import authRouter from './src/routes/auth';
import expensesRouter from './src/routes/expenses';
import categoriesRouter from './src/routes/categories';
import budgetsRouter from './src/routes/budgets';
import creditCardsRouter from './src/routes/credit_cards';
import billsRouter from './src/routes/bills';
import goalsRouter from './src/routes/goals';
import subscriptionsRouter from './src/routes/subscriptions';
import analyticsRouter from './src/routes/analytics';
import insightsRouter from './src/routes/insights';
import groupsRouter from './src/routes/groups';
import aiRouter from './src/routes/ai';

// Enterprise & Platform Scaling (Phase 5)
import workspacesRouter from './src/routes/workspaces';
import automationsRouter from './src/routes/automations';
import searchRouter from './src/routes/search';

// Helper to register API endpoints under versioned namespaces
const mountRoutes = (prefix: string) => {
  // Public Auth
  app.use(`${prefix}/auth`, authRouter);

  // Scoped Workspace Resources
  app.use(`${prefix}/expenses`, authenticate, expensesRouter);
  app.use(`${prefix}/categories`, authenticate, categoriesRouter);
  app.use(`${prefix}/budgets`, authenticate, budgetsRouter);
  app.use(`${prefix}/credit_cards`, authenticate, creditCardsRouter);
  app.use(`${prefix}/bills`, authenticate, billsRouter);
  app.use(`${prefix}/goals`, authenticate, goalsRouter);
  app.use(`${prefix}/subscriptions`, authenticate, subscriptionsRouter);
  app.use(`${prefix}/analytics`, authenticate, analyticsRouter);
  app.use(`${prefix}/insights`, authenticate, insightsRouter);
  app.use(`${prefix}/groups`, authenticate, groupsRouter);
  app.use(`${prefix}/ai`, authenticate, aiRouter);

  // Workspace Collaboration, Rules & Auditing
  app.use(`${prefix}/workspaces`, authenticate, workspacesRouter);
  app.use(`${prefix}/automations`, authenticate, automationsRouter);
  app.use(`${prefix}/search`, authenticate, searchRouter);
};

// Mount versioned v1 and backward-compatible paths
mountRoutes('/api/v1');
mountRoutes('/api');

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', apiVersion: 'v1', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use(errorHandler);

import { ensureDefaultWorkspaces } from './src/services/db/init';
import { startSchedulerJobs } from './src/services/jobs/scheduler';

ensureDefaultWorkspaces().then(() => {
  // Start background jobs cron simulator (runs accounting checks every 24 hours)
  startSchedulerJobs(24 * 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`\n🚀 Fintech Expense Tracker API running at http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
  });
});
