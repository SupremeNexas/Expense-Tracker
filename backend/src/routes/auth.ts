import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../db/prisma';
import { JWT_SECRET, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { seedCategoriesForUser, seedSampleDataForUser } from '../../prisma/seed';

const router = Router();

const validate = (req: any, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const passwordRules = body('password')
  .isLength({ min: 4 }).withMessage('Password must be at least 4 characters');

// Helper to generate access & refresh tokens
const generateTokens = (user: { id: string; email: string }) => {
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { token, refreshToken };
};

// POST /register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordRules
], validate, async (req: any, res: Response) => {
  try {
    const { name, email, password, baseCurrency = 'USD' } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        baseCurrency,
        isVerified: true, // Auto-verified for simplicity in demo
        settings: {
          create: {
            theme: 'light',
            currency: baseCurrency,
            language: 'en',
          }
        }
      }
    });

    // Seed default categories
    await seedCategoriesForUser(user.id);
    // Seed initial demo data
    await seedSampleDataForUser(user.id);

    const { token, refreshToken } = generateTokens(user);

    res.status(201).json({
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, baseCurrency: user.baseCurrency }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// POST /login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], validate, async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { token, refreshToken } = generateTokens(user);

    res.json({
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, baseCurrency: user.baseCurrency }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /refresh
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], validate, async (req: any, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string; email: string };
    
    // Fetch user to confirm existence
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid user in refresh token' });
    }

    const tokens = generateTokens(user);
    res.json({
      token: tokens.token,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /google-login
router.post('/google-login', [
  body('token').notEmpty().withMessage('Google auth token is required')
], validate, async (req: any, res: Response) => {
  try {
    const { name, email, googleId } = req.body; // Mock Google login payload from client
    
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Create user if not exists
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          passwordHash: dummyPassword,
          isVerified: true,
          settings: {
            create: {
              theme: 'light',
              currency: 'USD',
              language: 'en'
            }
          }
        }
      });
      await seedCategoriesForUser(user.id);
    }

    const { token, refreshToken } = generateTokens(user);
    res.json({
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, baseCurrency: user.baseCurrency }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login with Google' });
  }
});

// GET /me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { settings: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      baseCurrency: user.baseCurrency,
      createdAt: user.createdAt,
      settings: user.settings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PUT /currency
router.put('/currency', authenticate, [
  body('currency').isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']).withMessage('Unsupported currency')
], validate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { baseCurrency: req.body.currency }
    });

    await prisma.settings.upsert({
      where: { userId: req.user.id },
      update: { currency: req.body.currency },
      create: { userId: req.user.id, currency: req.body.currency }
    });

    res.json({ message: 'Currency updated successfully', baseCurrency: req.body.currency });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update currency' });
  }
});

// POST /seed
router.post('/seed', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    await seedCategoriesForUser(req.user.id);
    await seedSampleDataForUser(req.user.id);
    
    res.json({ message: 'Demo data seeded successfully' });
  } catch (err) {
    console.error('Seeding error:', err);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

export default router;
