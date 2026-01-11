import express from 'express';
import {
  register,
  login,
  verifyToken,
  createTestUser
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

// Create test user (development only)
router.post('/create-test-user', createTestUser);

export default router;
