import express from 'express';
import { setPreferences } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Set user preferences (onboarding)
router.post('/preferences', authenticateToken, setPreferences);

export default router;
