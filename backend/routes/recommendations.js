import express from 'express';
import {
  getGroupRecommendations,
  getSessionRecommendations,
  trainRecommendationModels,
  checkRecommendationServiceHealth,
  debugUserRecommendations
} from '../controllers/recommendationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get personalized group recommendations
router.get('/groups', getGroupRecommendations);

// Get personalized session recommendations
router.get('/sessions', getSessionRecommendations);

// Health check for recommendation service
router.get('/health', checkRecommendationServiceHealth);

// Debug endpoint to check user data and matching groups
router.get('/debug', authenticateToken, debugUserRecommendations);

// Train recommendation models (admin only - you might want to add admin middleware)
router.post('/train', trainRecommendationModels);

export default router;