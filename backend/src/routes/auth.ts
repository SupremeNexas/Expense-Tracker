import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db/prisma';
import { JWT_SECRET, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { seedCategoriesForUser, seedSampleDataForUser } from '../../prisma/seed';

const router = Router();

// ─── Brute-force protection on credential endpoints ──────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login/register attempts per 15 min per IP
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
} as any);

// ─── Google OAuth Client ─────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const passwordRules = body('password')
  .isLength({ min: 4 }).withMessage('Password must be at least 4 characters');

// Helper to generate access & refresh tokens
const generateTokens = (user: { id: string; email: string }) => {
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { token, refreshToken };
};

// ─── POST /register ──────────────────────────────────────────────────────────
router.post('/register', authLimiter, [
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
        authProvider: 'email',
        isVerified: true,
        lastLogin: new Date(),
        settings: {
          create: {
            theme: 'light',
            currency: baseCurrency,
            language: 'en',
          }
        }
      }
    });

    await seedCategoriesForUser(user.id);
    await seedSampleDataForUser(user.id);

    const { token, refreshToken } = generateTokens(user);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        baseCurrency: user.baseCurrency,
        authProvider: user.authProvider
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// ─── POST /login ─────────────────────────────────────────────────────────────
router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], validate, async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Block email/password login for Google-only accounts
    if (!user.passwordHash) {
      return res.status(400).json({
        error: 'This account uses Google Sign-In. Please sign in with Google.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update lastLogin timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const { token, refreshToken } = generateTokens(user);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        baseCurrency: user.baseCurrency,
        authProvider: user.authProvider
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ─── POST /refresh ───────────────────────────────────────────────────────────
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], validate, async (req: any, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string; email: string };

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

// ─── POST /google ─────────────────────────────────────────────────────────────
// Real Google OAuth: verifies the GSI credential (ID Token) server-side
// using google-auth-library before trusting any profile data.
router.post('/google', authLimiter, [
  body('idToken').notEmpty().withMessage('Google ID token is required')
], validate, async (req: any, res: Response) => {
  const { idToken } = req.body;

  if (!GOOGLE_CLIENT_ID) {
    console.error('[Google Auth] GOOGLE_CLIENT_ID is not configured in backend .env');
    return res.status(503).json({
      error: 'Google authentication is not configured on this server. Contact the administrator.'
    });
  }

  try {
    // ── 1. Verify the ID token with Google ──────────────────────────────────
    console.log('[Google Auth] Verifying ID token with Google...');
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token payload' });
    }

    const { sub: googleId, email, name, picture: avatar, email_verified } = payload;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Google profile is missing required fields' });
    }

    if (!email_verified) {
      return res.status(400).json({ error: 'Google email is not verified' });
    }

    console.log(`[Google Auth] Token verified — email: ${email}, googleId: ${googleId}`);

    // ── 2. Find or create the user ───────────────────────────────────────────
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (user) {
      // ── 2a. Existing user — update Google fields + lastLogin ───────────────
      console.log(`[Google Auth] Existing user found: ${user.id}`);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,                              // Link Google ID if not already set
          avatar: avatar || user.avatar,         // Update avatar from Google
          authProvider: user.authProvider === 'email' ? 'google' : user.authProvider,
          isVerified: true,
          lastLogin: new Date(),
        }
      });
    } else {
      // ── 2b. New user — create account ─────────────────────────────────────
      console.log(`[Google Auth] Creating new user for: ${email}`);
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          passwordHash: null,              // No password for Google-only users
          googleId,
          avatar: avatar || null,
          authProvider: 'google',
          isVerified: true,
          lastLogin: new Date(),
          baseCurrency: 'INR',            // Default; user can change in settings
          settings: {
            create: {
              theme: 'light',
              currency: 'INR',
              language: 'en',
            }
          }
        }
      });

      // Seed default categories and sample data for new users
      await seedCategoriesForUser(user.id);
      await seedSampleDataForUser(user.id);
      console.log(`[Google Auth] New user created and seeded: ${user.id}`);
    }

    // ── 3. Issue JWT + refresh token ─────────────────────────────────────────
    const { token, refreshToken } = generateTokens(user);
    console.log(`[Google Auth] JWT issued for user: ${user.id}`);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        baseCurrency: user.baseCurrency,
        authProvider: user.authProvider
      }
    });
  } catch (err: any) {
    console.error('[Google Auth] Verification failed:', err?.message || err);

    // Provide specific error messages for common failures
    if (err?.message?.includes('Token used too late')) {
      return res.status(401).json({ error: 'Google token expired. Please sign in again.' });
    }
    if (err?.message?.includes('Invalid token signature')) {
      return res.status(401).json({ error: 'Invalid Google token. Please sign in again.' });
    }
    if (err?.message?.includes('Wrong number of segments')) {
      return res.status(400).json({ error: 'Malformed Google token received.' });
    }

    res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// ─── GET /me ──────────────────────────────────────────────────────────────────
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
      avatar: user.avatar,
      baseCurrency: user.baseCurrency,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      settings: user.settings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ─── PUT /currency ────────────────────────────────────────────────────────────
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

// ─── POST /seed ───────────────────────────────────────────────────────────────
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
