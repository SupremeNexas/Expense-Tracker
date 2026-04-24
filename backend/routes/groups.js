const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const GroupSettlement = require('../models/GroupSettlement');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  next();
};

// Middleware to verify group membership
const verifyMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some(m => m.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Not a group member' });
    }
    req.group = group;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify membership' });
  }
};

// CREATE GROUP
router.post('/', [
  body('name').trim().notEmpty().withMessage('Group name required')
], validate, async (req, res) => {
  try {
    const { name } = req.body;
    const group = new Group({
      name,
      created_by: req.user.id,
      members: [req.user.id]
    });
    await group.save();
    res.status(201).json({ ...group.toObject(), id: group._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// GET MY GROUPS
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id });
    const mapped = groups.map(g => ({
      ...g.toObject(),
      id: g._id,
      member_count: g.members.length
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET GROUP DETAILS (Members & Balances & Expenses)
router.get('/:id', verifyMember, async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId).populate('members', 'name email');
    const expenses = await GroupExpense.find({ group: groupId }).populate('paid_by', 'name').sort({ date: -1 });
    const settlements = await GroupSettlement.find({ group: groupId }).populate('paid_by paid_to', 'name').sort({ date: -1 });

    // Calculate Balances
    const balances = {};
    group.members.forEach(m => {
      balances[m._id] = {};
      group.members.forEach(m2 => {
        if (m._id.toString() !== m2._id.toString()) balances[m._id][m2._id] = 0;
      });
    });

    // Process expenses
    expenses.forEach(e => {
      const payerId = e.paid_by._id.toString();
      e.splits.forEach(split => {
        const borrowerId = split.user.toString();
        const amount = split.amount_owed;
        if (payerId !== borrowerId && balances[borrowerId] && balances[borrowerId][payerId] !== undefined) {
          balances[borrowerId][payerId] += amount;
          balances[payerId][borrowerId] -= amount;
        }
      });
    });

    // Process settlements
    settlements.forEach(s => {
      const payerId = s.paid_by._id.toString();
      const payeeId = s.paid_to._id.toString();
      const amount = s.amount;
      if (balances[payerId] && balances[payerId][payeeId] !== undefined) {
        balances[payerId][payeeId] -= amount;
        balances[payeeId][payerId] += amount;
      }
    });

    // Round balances to 2 decimal places to fix floating point issues
    Object.keys(balances).forEach(u1 => {
      Object.keys(balances[u1]).forEach(u2 => {
        balances[u1][u2] = Math.round(balances[u1][u2] * 100) / 100;
        // Clean up tiny values that should be zero
        if (Math.abs(balances[u1][u2]) < 0.01) balances[u1][u2] = 0;
      });
    });

    res.json({
      group: { ...group.toObject(), id: group._id },
      members: group.members.map(m => ({ ...m.toObject(), id: m._id })),
      expenses: expenses.map(e => ({ ...e.toObject(), id: e._id, paid_by_name: e.paid_by.name })),
      settlements: settlements.map(s => ({ ...s.toObject(), id: s._id, paid_by_name: s.paid_by.name, paid_to_name: s.paid_to.name })),
      balances
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// ADD MEMBER (Using email)
router.post('/:id/members', verifyMember, [
  body('email').isEmail().withMessage('Valid email required')
], validate, async (req, res) => {
  try {
    const userToAdd = await User.findOne({ email: req.body.email });
    if (!userToAdd) return res.status(404).json({ error: 'User not found with this email' });

    if (req.group.members.includes(userToAdd._id)) {
      return res.status(400).json({ error: 'User already in group' });
    }

    req.group.members.push(userToAdd._id);
    await req.group.save();
    
    res.json({ message: 'Member added', member: { id: userToAdd._id, name: userToAdd.name, email: userToAdd.email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// ADD GROUP EXPENSE
router.post('/:id/expenses', verifyMember, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  body('date').notEmpty(),
  body('paid_by_user_id').notEmpty(),
  body('splits').isArray({ min: 1 })
], validate, async (req, res) => {
  try {
    const { title, amount, date, paid_by_user_id, splits } = req.body;

    // Verify payer is in group
    if (!req.group.members.some(m => m.toString() === paid_by_user_id)) {
      return res.status(400).json({ error: 'Payer not in group' });
    }

    // Verify splits total == amount
    const splitTotal = splits.reduce((sum, s) => sum + Number(s.amount_owed), 0);
    if (Math.abs(splitTotal - amount) > 0.01) {
      return res.status(400).json({ error: 'Splits must add up to total amount' });
    }

    const expense = new GroupExpense({
      group: req.params.id,
      paid_by: paid_by_user_id,
      title,
      amount: Number(amount),
      date,
      splits: splits.map(s => ({
        user: s.user_id,
        amount_owed: Number(s.amount_owed)
      }))
    });

    await expense.save();
    res.status(201).json({ message: 'Expense added', id: expense._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add group expense', details: err.message });
  }
});

// ADD SETTLEMENT (Pay off debt)
router.post('/:id/settlements', verifyMember, [
  body('paid_to_user_id').notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('date').notEmpty()
], validate, async (req, res) => {
  try {
    const paidBy = req.user.id;
    const paidTo = req.body.paid_to_user_id;

    if (!req.group.members.some(m => m.toString() === paidTo)) {
      return res.status(400).json({ error: 'Payee not in group' });
    }

    const settlement = new GroupSettlement({
      group: req.params.id,
      paid_by: paidBy,
      paid_to: paidTo,
      amount: Number(req.body.amount),
      date: req.body.date
    });

    await settlement.save();
    res.status(201).json({ message: 'Settlement recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record settlement' });
  }
});

module.exports = router;
