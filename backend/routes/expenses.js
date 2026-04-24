const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { expenseRules, validate } = require('../middleware/validation');
const mongoose = require('mongoose');

// GET /api/expenses — list all, with optional filters
router.get('/', async (req, res) => {
  try {
    const { month, year, category_id, search, sort = 'date', order = 'desc' } = req.query;

    let filter = { user: req.user.id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    if (category_id) {
      filter.category = category_id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const expenses = await Expense.find(filter)
      .populate('category')
      .sort(sortObj);
    
    // Map _id to id for frontend compatibility
    const mappedExpenses = expenses.map(e => ({
      ...e.toObject(),
      id: e._id,
      category_id: e.category?._id,
      category_name: e.category?.name,
      category_color: e.category?.color,
      category_icon: e.category?.icon
    }));

    res.json(mappedExpenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/:id
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id })
      .populate('category');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({
      ...expense.toObject(),
      id: expense._id,
      category_id: expense.category?._id,
      category_name: expense.category?.name,
      category_color: expense.category?.color,
      category_icon: expense.category?.icon
    });
  } catch (err) {
    console.error('Error fetching expense:', err);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST /api/expenses
router.post('/', expenseRules, validate, async (req, res) => {
  try {
    const { title, amount, category_id, date, notes = '', payment_method = 'Card', tags = [] } = req.body;

    const category = await Category.findOne({ _id: category_id, user: req.user.id });
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const expense = new Expense({
      user: req.user.id,
      title,
      amount: Number(amount),
      category: category_id,
      date,
      notes,
      payment_method,
      tags: Array.isArray(tags) ? tags : []
    });

    await expense.save();
    
    const populated = await Expense.findById(expense._id).populate('category');
    
    res.status(201).json({
      ...populated.toObject(),
      id: populated._id,
      category_id: populated.category?._id,
      category_name: populated.category?.name,
      category_color: populated.category?.color,
      category_icon: populated.category?.icon
    });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', expenseRules, validate, async (req, res) => {
  try {
    const { title, amount, category_id, date, notes = '', payment_method = 'Card', tags = [] } = req.body;

    const expense = await Expense.findOne({ _id: req.params.id, user: req.user.id });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const category = await Category.findOne({ _id: category_id, user: req.user.id });
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }

    expense.title = title;
    expense.amount = Number(amount);
    expense.category = category_id;
    expense.date = date;
    expense.notes = notes;
    expense.payment_method = payment_method;
    expense.tags = Array.isArray(tags) ? tags : [];

    await expense.save();
    
    const populated = await Expense.findById(expense._id).populate('category');

    res.json({
      ...populated.toObject(),
      id: populated._id,
      category_id: populated.category?._id,
      category_name: populated.category?.name,
      category_color: populated.category?.color,
      category_icon: populated.category?.icon
    });
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await Expense.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
