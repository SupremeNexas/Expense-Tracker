require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db/database');
const { authenticate } = require('./middleware/auth');

const app = express();
connectDB();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Public Routes
app.use('/api/auth', require('./routes/auth'));

// Protected Routes
app.use('/api/expenses', authenticate, require('./routes/expenses'));
app.use('/api/categories', authenticate, require('./routes/categories'));
app.use('/api/budgets', authenticate, require('./routes/budgets'));
app.use('/api/analytics', authenticate, require('./routes/analytics'));
app.use('/api/subscriptions', authenticate, require('./routes/subscriptions'));
app.use('/api/credit_cards', authenticate, require('./routes/credit_cards'));
app.use('/api/bills', authenticate, require('./routes/bills'));
app.use('/api/goals', authenticate, require('./routes/goals'));
app.use('/api/insights', authenticate, require('./routes/insights'));
app.use('/api/groups', authenticate, require('./routes/groups'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Fintech Expense Tracker API running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});
