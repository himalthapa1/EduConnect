import express from 'express';
import { setPreferences, changePassword } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Set user preferences (onboarding)
router.post('/preferences', authenticateToken, setPreferences);

// Change user password
router.post('/change-password', authenticateToken, changePassword);

export default router;
