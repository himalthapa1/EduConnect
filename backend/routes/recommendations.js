import express from 'express';
import {
  getGroupRecommendations,
  getSessionRecommendations,
  trainRecommendationModels,
  checkRecommendationServiceHealth
} from '../controllers/recommendationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// TEMPORARILY DISABLE AUTHENTICATION FOR DEBUGGING
// router.use(authenticateToken);

// Get personalized group recommendations
router.get('/groups', getGroupRecommendations);

// Get personalized session recommendations
router.get('/sessions', getSessionRecommendations);

// Health check for recommendation service
router.get('/health', checkRecommendationServiceHealth);

// Train recommendation models (admin only - you might want to add admin middleware)
router.post('/train', trainRecommendationModels);

export default router;
