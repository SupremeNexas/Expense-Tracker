const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const { budgetRules, validate } = require('../middleware/validation');
const mongoose = require('mongoose');

// GET /api/budgets
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;

    let filter = { user: req.user.id };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const budgets = await Budget.find(filter).populate('category');

    const result = await Promise.all(budgets.map(async (b) => {
      const start = new Date(b.year, b.month - 1, 1);
      const end = new Date(b.year, b.month, 0, 23, 59, 59);

      const spent = await Expense.aggregate([
        { 
          $match: { 
            user: new mongoose.Types.ObjectId(req.user.id),
            category: b.category._id,
            date: { $gte: start, $lte: end }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return {
        ...b.toObject(),
        id: b._id,
        category_name: b.category?.name,
        category_color: b.category?.color,
        category_icon: b.category?.icon,
        spent: spent.length > 0 ? spent[0].total : 0
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// POST /api/budgets
router.post('/', budgetRules, validate, async (req, res) => {
  try {
    const { category_id, amount, month, year, period = 'monthly' } = req.body;

    const category = await Category.findOne({ _id: category_id, user: req.user.id });
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, category: category_id, month, year },
      { amount: Number(amount), period },
      { upsert: true, new: true }
    ).populate('category');

    const start = new Date(budget.year, budget.month - 1, 1);
    const end = new Date(budget.year, budget.month, 0, 23, 59, 59);

    const spent = await Expense.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(req.user.id),
          category: budget.category._id,
          date: { $gte: start, $lte: end }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(201).json({
      ...budget.toObject(),
      id: budget._id,
      category_name: budget.category?.name,
      category_color: budget.category?.color,
      category_icon: budget.category?.icon,
      spent: spent.length > 0 ? spent[0].total : 0
    });
  } catch (err) {
    console.error('Error creating budget:', err);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await Budget.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Error deleting budget:', err);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

module.exports = router;
