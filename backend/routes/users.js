import express from 'express';
import { setPreferences, changePassword, updateStudyStreak, getUserProfile } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, getUserProfile);

// Set user preferences (onboarding)
router.post('/preferences', authenticateToken, setPreferences);

// Change user password
router.post('/change-password', authenticateToken, changePassword);

// Update study streak
router.post('/study-streak', authenticateToken, updateStudyStreak);

export default router;
