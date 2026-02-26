import express from 'express';
import passport from 'passport';
import {
  register,
  login,
  verifyToken,
  createTestUser,
  googleCallback
} from '../controllers/authController.js';

import {
  validateRegistration,
  validateLogin,
  authRateLimiter,
  authenticateToken
} from '../middleware/auth.js';

const router = express.Router();

// Register
router.post(
  '/register',
  authRateLimiter,
  validateRegistration,
  register
);

// Login
router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  login
);

// Verify token
router.get(
  '/verify',
  authenticateToken,
  verifyToken
);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`,
    session: false 
  }),
  googleCallback
);

// Create test user (development only)
router.post('/create-test-user', createTestUser);

export default router;
