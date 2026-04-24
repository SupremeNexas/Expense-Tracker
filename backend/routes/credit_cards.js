const express = require('express');
const router = express.Router();
const CreditCard = require('../models/CreditCard');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  next();
};

const cardRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('limit_amount').isFloat({ min: 0 }).withMessage('Valid limit required'),
  body('total_due').optional().isFloat({ min: 0 }),
  body('minimum_due').optional().isFloat({ min: 0 }),
  body('due_date').isISO8601().withMessage('Valid date required'),
];

router.get('/', async (req, res) => {
  try {
    const cards = await CreditCard.find({ user: req.user.id }).sort({ due_date: 1 });
    
    // Add computed insights
    const enhancedCards = cards.map(c => {
      const usage = c.limit_amount > 0 ? (c.total_due / c.limit_amount) * 100 : 0;
      let riskLevel = 'Low';
      if (usage > 30) riskLevel = 'Medium';
      if (usage > 70) riskLevel = 'High';
      
      const dueDays = Math.ceil((new Date(c.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      
      return { 
        ...c.toObject(), 
        id: c._id,
        usage_percentage: Math.round(usage), 
        risk_level: riskLevel, 
        days_until_due: dueDays 
      };
    });
    res.json(enhancedCards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

router.post('/', cardRules, validate, async (req, res) => {
  try {
    const { name, limit_amount, total_due = 0, minimum_due = 0, due_date, billing_cycle_start, billing_cycle_end } = req.body;
    
    const card = new CreditCard({
      user: req.user.id,
      name,
      limit_amount: Number(limit_amount),
      total_due: Number(total_due),
      minimum_due: Number(minimum_due),
      due_date,
      billing_cycle_start,
      billing_cycle_end
    });

    await card.save();
    res.status(201).json({ ...card.toObject(), id: card._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

router.put('/:id', cardRules, validate, async (req, res) => {
  try {
    const { name, limit_amount, total_due, minimum_due, due_date, billing_cycle_start, billing_cycle_end } = req.body;
    
    const card = await CreditCard.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        name,
        limit_amount: Number(limit_amount),
        total_due: Number(total_due),
        minimum_due: Number(minimum_due),
        due_date,
        billing_cycle_start,
        billing_cycle_end
      },
      { new: true }
    );
    
    if (!card) return res.status(404).json({ error: 'Not found' });
    res.json({ ...card.toObject(), id: card._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await CreditCard.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

module.exports = router;
