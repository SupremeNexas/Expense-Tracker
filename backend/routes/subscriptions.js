const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const subRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be positive'),
  body('billing_cycle').isIn(['monthly', 'yearly']).withMessage('Must be monthly or yearly'),
  body('renewal_date').isISO8601().withMessage('Valid date required'),
];

router.get('/', async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user.id }).sort({ renewal_date: 1 });
    res.json(subs.map(s => ({ ...s.toObject(), id: s._id })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

router.post('/', subRules, validate, async (req, res) => {
  try {
    const { name, cost, billing_cycle, renewal_date, payment_source = 'Primary Card', is_active = true } = req.body;
    
    const sub = new Subscription({
      user: req.user.id,
      name,
      cost: Number(cost),
      billing_cycle,
      renewal_date,
      payment_source,
      is_active: !!is_active
    });

    await sub.save();
    res.status(201).json({ ...sub.toObject(), id: sub._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

router.put('/:id', subRules, validate, async (req, res) => {
  try {
    const { name, cost, billing_cycle, renewal_date, payment_source, is_active } = req.body;
    
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        name,
        cost: Number(cost),
        billing_cycle,
        renewal_date,
        payment_source,
        is_active: !!is_active
      },
      { new: true }
    );
    
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json({ ...sub.toObject(), id: sub._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Subscription.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;
