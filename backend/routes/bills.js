const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  next();
};

const billRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('due_date').isISO8601().withMessage('Valid date required'),
  body('status').isIn(['pending', 'paid', 'overdue']).withMessage('Invalid status')
];

router.get('/', async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.id }).sort({ due_date: 1 });
    res.json(bills.map(b => ({ ...b.toObject(), id: b._id })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.post('/', billRules, validate, async (req, res) => {
  try {
    const { name, amount, due_date, status = 'pending' } = req.body;
    
    const bill = new Bill({
      user: req.user.id,
      name,
      amount: Number(amount),
      due_date,
      status
    });

    await bill.save();
    res.status(201).json({ ...bill.toObject(), id: bill._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

router.put('/:id', billRules, validate, async (req, res) => {
  try {
    const { name, amount, due_date, status } = req.body;
    
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        name,
        amount: Number(amount),
        due_date,
        status
      },
      { new: true }
    );
    
    if (!bill) return res.status(404).json({ error: 'Not found' });
    res.json({ ...bill.toObject(), id: bill._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Bill.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

module.exports = router;
