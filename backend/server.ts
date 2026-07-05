import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authenticate } from './src/middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/expenses', authenticate, expensesRouter);
app.use('/api/categories', authenticate, categoriesRouter);
app.use('/api/budgets', authenticate, budgetsRouter);
app.use('/api/credit_cards', authenticate, creditCardsRouter);
app.use('/api/bills', authenticate, billsRouter);
app.use('/api/goals', authenticate, goalsRouter);
app.use('/api/subscriptions', authenticate, subscriptionsRouter);
app.use('/api/analytics', authenticate, analyticsRouter);
app.use('/api/insights', authenticate, insightsRouter);
app.use('/api/groups', authenticate, groupsRouter);
app.use('/api/ai', authenticate, aiRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Fintech Expense Tracker API running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});
