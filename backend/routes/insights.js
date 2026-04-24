const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Expense = require('../models/Expense');
const CreditCard = require('../models/CreditCard');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const insights = [];

    // 1. Check active subscriptions
    const subAgg = await Subscription.aggregate([
      { $match: { user: userId, is_active: true } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: '$cost' }
        }
      }
    ]);
    
    if (subAgg.length > 0) {
      insights.push({
        type: 'subscription',
        title: 'Active Subscriptions',
        message: `You have ${subAgg[0].count} active subscriptions costing $${(subAgg[0].total || 0).toFixed(2)} per billing cycle. Consider reviewing them for unused services.`,
        actionUrl: '/subscriptions'
      });
    }

    // 2. Spending trend (current month vs last month)
    const now = new Date();
    const currStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currSpentAgg = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: currStart, $lte: currEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const prevSpentAgg = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const currSpent = currSpentAgg[0]?.total || 0;
    const prevSpent = prevSpentAgg[0]?.total || 0;

    if (prevSpent > 0) {
      const diff = ((currSpent - prevSpent) / prevSpent) * 100;
      if (diff > 20) {
        insights.push({
          type: 'danger', // Changed from warning for high burn
          title: 'High Spending Alert',
          message: `Your spending this month is ${diff.toFixed(0)}% higher than last month.`,
          actionUrl: '/analytics'
        });
      } else if (diff < -10) {
        insights.push({
          type: 'success',
          title: 'Great Job Saving!',
          message: `Your spending is ${Math.abs(diff).toFixed(0)}% lower than last month.`,
          actionUrl: '/analytics'
        });
      }
    }

    // 3. Credit Card alerts (due within 5 days)
    const cards = await CreditCard.find({ user: userId });
    for (const card of cards) {
      const dueDays = Math.ceil((new Date(card.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (dueDays >= 0 && dueDays <= 5) {
        insights.push({
          type: 'danger',
          title: 'Credit Card Due Soon',
          message: `Your ${card.name} card payment is due in ${dueDays} days. Pay now to avoid interest.`,
          actionUrl: '/credit-cards'
        });
      }
    }

    res.json(insights);
  } catch (err) {
    console.error('Error fetching insights:', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

module.exports = router;
