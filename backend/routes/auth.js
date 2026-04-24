const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');
const { seedCategoriesForUser, seedSampleDataForUser } = require('../db/seed');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const passwordRules = body('password')
  .isLength({ min: 4 }).withMessage('Password must be at least 4 characters');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordRules
], validate, async (req, res) => {
  try {
    const { name, email, password, base_currency = 'USD' } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password_hash: hash,
      base_currency
    });

    await user.save();

    // Note: seeding logic will need to be updated to be async
    await seedCategoriesForUser(user._id);
    await seedSampleDataForUser(user._id);

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name, email, base_currency }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, base_currency: user.base_currency }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      base_currency: user.base_currency,
      created_at: user.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.put('/currency', require('../middleware/auth').authenticate, [
  body('currency').isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']).withMessage('Unsupported currency')
], validate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { base_currency: req.body.currency },
      { new: true }
    );
    res.json({ message: 'Currency updated successfully', base_currency: user.base_currency });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update currency' });
  }
});

module.exports = router;
