const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    let match = { user: new mongoose.Types.ObjectId(req.user.id) };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      match.date = { $gte: start, $lte: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      match.date = { $gte: start, $lte: end };
    }

    const summaryResults = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      }
    ]);

    const summary = summaryResults[0] || { total: 0, count: 0, average: 0 };

    const highest = await Expense.findOne(match)
      .populate('category', 'name')
      .sort({ amount: -1 });

    res.json({
      total: Math.round(summary.total * 100) / 100,
      count: summary.count,
      average: Math.round(summary.average * 100) / 100,
      highest: highest ? {
        ...highest.toObject(),
        id: highest._id,
        category_name: highest.category?.name
      } : null,
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /api/analytics/by-category
router.get('/by-category', async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    let expenseMatch = { user: userId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      expenseMatch.date = { $gte: start, $lte: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      expenseMatch.date = { $gte: start, $lte: end };
    }

    const breakdown = await Category.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: 'expenses',
          let: { catId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$category', '$$catId'] },
                ...expenseMatch,
                // We need to re-apply the user filter and date filter here if necessary, 
                // but since we lookup from expenses and match expenseMatch it should work.
              } 
            }
          ],
          as: 'catExpenses'
        }
      },
      {
        $project: {
          name: 1,
          color: 1,
          icon: 1,
          total: { $sum: '$catExpenses.amount' },
          count: { $size: '$catExpenses' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(breakdown.map(b => ({ ...b, id: b._id })));
  } catch (err) {
    console.error('Error fetching category breakdown:', err);
    res.status(500).json({ error: 'Failed to fetch category breakdown' });
  }
});

// GET /api/analytics/trend
router.get('/trend', async (req, res) => {
  try {
    const trend = [];
    const now = new Date();
    const userId = new mongoose.Types.ObjectId(req.user.id);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });

      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);

      const result = await Expense.aggregate([
        { 
          $match: { 
            user: userId,
            date: { $gte: start, $lte: end }
          } 
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const data = result[0] || { total: 0, count: 0 };

      trend.push({
        month: label,
        monthNum: m,
        year: y,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
      });
    }

    res.json(trend);
  } catch (err) {
    console.error('Error fetching trend:', err);
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

// GET /api/analytics/budget-status
router.get('/budget-status', async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month || now.getMonth() + 1);
    const year = Number(req.query.year || now.getFullYear());
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const budgets = await Budget.find({ user: userId, month, year }).populate('category');

    const result = await Promise.all(budgets.map(async (b) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const expenseAgg = await Expense.aggregate([
        { 
          $match: { 
            user: userId,
            category: b.category._id,
            date: { $gte: start, $lte: end }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const spent = expenseAgg[0]?.total || 0;
      const amount = b.amount;

      return {
        ...b.toObject(),
        id: b._id,
        category_name: b.category?.name,
        category_color: b.category?.color,
        category_icon: b.category?.icon,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round((amount - spent) * 100) / 100,
        percentage: amount > 0 ? Math.round((spent / amount) * 100) : 0,
        over_budget: spent > amount,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching budget status:', err);
    res.status(500).json({ error: 'Failed to fetch budget status' });
  }
});

module.exports = router;
