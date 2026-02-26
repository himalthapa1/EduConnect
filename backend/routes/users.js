import express from 'express';
import { 
  setPreferences, 
  changePassword, 
  uploadProfilePicture, 
  getUserProfile,
  updateStudyStreak,
  getUserAnalytics 
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, getUserProfile);

// Get user analytics
router.get('/analytics', authenticateToken, getUserAnalytics);

// Set user preferences (onboarding)
router.post('/preferences', authenticateToken, setPreferences);

// Change user password
router.post('/change-password', authenticateToken, changePassword);

// Upload profile picture
router.post('/profile-picture', authenticateToken, upload.single('profilePicture'), uploadProfilePicture);

// Update study streak
router.post('/study-streak', authenticateToken, updateStudyStreak);

export default router;
