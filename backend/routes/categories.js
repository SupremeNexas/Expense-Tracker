const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { categoryRules, validate } = require('../middleware/validation');
const mongoose = require('mongoose');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $lookup: {
          from: 'expenses',
          localField: '_id',
          foreignField: 'category',
          as: 'expenses'
        }
      },
      {
        $project: {
          name: 1,
          color: 1,
          icon: 1,
          expense_count: { $size: '$expenses' },
          total_spent: { $sum: '$expenses.amount' }
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    // Map _id to id for frontend compatibility
    const mappedCategories = categories.map(c => ({
      ...c,
      id: c._id
    }));
    
    res.json(mappedCategories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.aggregate([
      { 
        $match: { 
          _id: new mongoose.Types.ObjectId(req.params.id),
          user: new mongoose.Types.ObjectId(req.user.id) 
        } 
      },
      {
        $lookup: {
          from: 'expenses',
          localField: '_id',
          foreignField: 'category',
          as: 'expenses'
        }
      },
      {
        $project: {
          name: 1,
          color: 1,
          icon: 1,
          expense_count: { $size: '$expenses' },
          total_spent: { $sum: '$expenses.amount' }
        }
      }
    ]);

    if (!category || category.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ ...category[0], id: category[0]._id });
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories
router.post('/', categoryRules, validate, async (req, res) => {
  try {
    const { name, color, icon = 'more-horizontal' } = req.body;

    const existing = await Category.findOne({
      user: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const category = new Category({
      user: req.user.id,
      name,
      color,
      icon
    });

    await category.save();
    res.status(201).json({ ...category.toObject(), id: category._id });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', categoryRules, validate, async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = await Category.findOne({ _id: req.params.id, user: req.user.id });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const duplicate = await Category.findOne({
      user: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    
    if (duplicate) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    category.name = name;
    category.color = color;
    category.icon = icon;
    
    await category.save();
    res.json({ ...category.toObject(), id: category._id });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user.id });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const expenseCount = await Expense.countDocuments({ category: req.params.id, user: req.user.id });

    if (expenseCount > 0) {
      return res.status(409).json({
        error: `Cannot delete category: ${expenseCount} expense(s) are using it.`,
      });
    }

    await Budget.deleteMany({ category: req.params.id, user: req.user.id });
    await Category.deleteOne({ _id: req.params.id, user: req.user.id });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
