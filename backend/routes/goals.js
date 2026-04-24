const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  next();
};

const goalRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('target_amount').isFloat({ min: 0.01 }).withMessage('Valid target required'),
  body('current_amount').optional().isFloat({ min: 0 }),
  body('deadline').isISO8601().withMessage('Valid date required'),
];

router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ deadline: 1 });
    res.json(goals.map(g => ({ ...g.toObject(), id: g._id })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/', goalRules, validate, async (req, res) => {
  try {
    const { name, target_amount, current_amount = 0, deadline } = req.body;
    
    const goal = new Goal({
      user: req.user.id,
      name,
      target_amount: Number(target_amount),
      current_amount: Number(current_amount),
      deadline
    });

    await goal.save();
    res.status(201).json({ ...goal.toObject(), id: goal._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/:id', goalRules, validate, async (req, res) => {
  try {
    const { name, target_amount, current_amount, deadline } = req.body;
    
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        name,
        target_amount: Number(target_amount),
        current_amount: Number(current_amount),
        deadline
      },
      { new: true }
    );
    
    if (!goal) return res.status(404).json({ error: 'Not found' });
    res.json({ ...goal.toObject(), id: goal._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Goal.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
