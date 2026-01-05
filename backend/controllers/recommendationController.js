import axios from 'axios';

// Python recommendation service URL
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:5000';

/* =========================
   GET GROUP RECOMMENDATIONS
========================= */
export const getGroupRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { limit = 10 } = req.query;

    // If not authenticated, return basic recommendations
    if (!userId) {
      const StudyGroup = (await import('../models/StudyGroup.js')).default;

      // Get public groups sorted by activity and member count
      const groups = await StudyGroup.find({ isPublic: true })
        .sort({ activityScore: -1, members: -1 })
        .limit(parseInt(limit));

      const recommendations = groups.map(group => ({
        group_id: group._id.toString(),
        name: group.name,
        subject: group.subject,
        difficulty: group.difficulty || 'beginner',
        members_count: group.members?.length || 0,
        score: 0.5 // Default score for unauthenticated users
      }));

      return res.json({
        success: true,
        data: recommendations,
        message: 'Basic recommendations (not authenticated)'
      });
    }

    // Try to call Python recommendation service first
    try {
      const response = await axios.post(
        `${RECOMMENDATION_SERVICE_URL}/api/recommendations/groups`,
        {
          user_id: userId,
          limit: parseInt(limit)
        },
        {
          timeout: 5000 // 5 second timeout
        }
      );

      return res.json({
        success: true,
        data: response.data.recommendations || []
      });
    } catch (pythonError) {
      console.log('Python service unavailable, using fallback recommendations');
    }

    // Fallback: Get basic recommendations from MongoDB
    const StudyGroup = (await import('../models/StudyGroup.js')).default;
    const User = (await import('../models/User.js')).default;

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: true,
        data: []
      });
    }

    const userInterests = user.preferences?.interests || [];
    const joinedGroups = user.joinedGroups || [];

    // Get public groups excluding already joined ones
    const groups = await StudyGroup.find({
      isPublic: true,
      _id: { $nin: joinedGroups }
    })
    .sort({ activityScore: -1, members: -1 }) // Sort by activity and member count
    .limit(parseInt(limit));

    // Calculate simple scores based on interest matching
    const recommendations = groups.map(group => {
      const groupTags = group.subjectTags || [];
      const interestMatch = userInterests.filter(interest =>
        groupTags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
      ).length;

      const score = interestMatch > 0 ? 0.7 + (interestMatch / userInterests.length) * 0.3 : 0.3;

      return {
        group_id: group._id.toString(),
        name: group.name,
        subject: group.subject,
        difficulty: group.difficulty || 'beginner',
        members_count: group.members?.length || 0,
        score: Math.round(score * 100) / 100
      };
    });

    res.json({
      success: true,
      data: recommendations,
      message: 'Using basic recommendations (Python service unavailable)'
    });

  } catch (error) {
    console.error('Error getting group recommendations:', error.message);

    res.json({
      success: true,
      data: [],
      message: 'Recommendations temporarily unavailable'
    });
  }
};

/* =========================
   GET SESSION RECOMMENDATIONS
========================= */
export const getSessionRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Call Python recommendation service
    const response = await axios.post(
      `${RECOMMENDATION_SERVICE_URL}/api/recommendations/sessions`,
      {
        user_id: userId,
        limit: parseInt(limit)
      },
      {
        timeout: 10000 // 10 second timeout
      }
    );

    res.json({
      success: true,
      data: response.data.recommendations || []
    });

  } catch (error) {
    console.error('Error getting session recommendations:', error.message);

    // Return empty recommendations instead of error for better UX
    res.json({
      success: true,
      data: [],
      message: 'Recommendations temporarily unavailable'
    });
  }
};

/* =========================
   TRAIN RECOMMENDATION MODELS (ADMIN)
========================= */
export const trainRecommendationModels = async (req, res) => {
  try {
    // Call Python service to train models
    const response = await axios.post(
      `${RECOMMENDATION_SERVICE_URL}/api/recommendations/train`,
      {},
      {
        timeout: 30000 // 30 second timeout for training
      }
    );

    res.json({
      success: true,
      message: response.data.message || 'Models trained successfully'
    });

  } catch (error) {
    console.error('Error training models:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to train recommendation models'
    });
  }
};

/* =========================
   HEALTH CHECK FOR RECOMMENDATION SERVICE
========================= */
export const checkRecommendationServiceHealth = async (req, res) => {
  try {
    const response = await axios.get(
      `${RECOMMENDATION_SERVICE_URL}/health`,
      { timeout: 5000 }
    );

    res.json({
      success: true,
      status: response.data.status,
      service: 'recommendation-engine'
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Recommendation service unavailable',
      details: error.message
    });
  }
};
