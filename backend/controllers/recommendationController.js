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

    console.log('=== GET GROUP RECOMMENDATIONS ===');
    console.log('User ID:', userId);

    // If not authenticated, return empty recommendations
    // (Users should log in to get personalized recommendations)
    if (!userId) {
      console.log('No user ID - returning empty recommendations');
      return res.json({
        success: true,
        data: [],
        message: 'Please log in to see personalized recommendations'
      });
    }

    // Try to call Python recommendation service first
    try {
      console.log('Attempting to call Python service at:', RECOMMENDATION_SERVICE_URL);
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

      let recommendations = response.data.recommendations || [];
      console.log('Python service returned', recommendations.length, 'recommendations');
      
      // Apply qualification rule: Only groups with finalScore >= 0.45 (45% threshold)
      recommendations = recommendations.filter(rec => rec.score >= 0.45);
      console.log('After 45% filter:', recommendations.length, 'recommendations');
      
      // Sort by score and limit to 6 groups maximum (as specified in requirements)
      recommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      return res.json({
        success: true,
        data: recommendations
      });
    } catch (pythonError) {
      console.log('Python service unavailable:', pythonError.message);
      console.log('Using fallback recommendations');
    }

    // Fallback: Get basic recommendations from MongoDB
    const StudyGroup = (await import('../models/StudyGroup.js')).default;
    const User = (await import('../models/User.js')).default;

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found in database');
      return res.json({
        success: true,
        data: []
      });
    }

    const userInterests = user.preferences?.interests || [];
    const joinedGroups = user.joinedGroups || [];

    console.log('User interests:', userInterests);
    console.log('User joined groups:', joinedGroups.map(g => g.toString()));

    // Get public groups excluding already joined ones
    const groups = await StudyGroup.find({
      isPublic: true,
      _id: { $nin: joinedGroups }
    })
    .sort({ activityScore: -1, members: -1 }) // Sort by activity and member count
    .limit(parseInt(limit));

    console.log('Found', groups.length, 'groups (excluding joined)');

    // Calculate scores using the required formula: (interestSimilarity × 0.6) + (popularityScore × 0.4)
    // Groups need 45% or higher to be recommended
    const recommendations = groups.map(group => {
      const groupTags = group.subjectTags || [];
      
      console.log(`\nGroup: ${group.name}`);
      console.log('  Group tags:', groupTags);
      
      const interestMatch = userInterests.filter(interest =>
        groupTags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
      ).length;

      console.log('  Interest matches:', interestMatch, 'out of', userInterests.length);

      // Calculate interest similarity (0-1)
      const interestSimilarity = userInterests.length > 0 
        ? interestMatch / userInterests.length 
        : 0;

      // Calculate popularity score based on members and activity
      const membersScore = Math.min((group.members?.length || 0) / 100, 1.0);
      const activityScore = Math.min((group.activityScore || 0) / 1000, 1.0);
      const popularityScore = (membersScore * 0.5) + (activityScore * 0.3) + 0.2; // 0.2 base score

      // Apply required formula: finalScore = (interestSimilarity × 0.6) + (popularityScore × 0.4)
      const finalScore = (interestSimilarity * 0.6) + (popularityScore * 0.4);

      console.log('  Interest similarity:', interestSimilarity.toFixed(3));
      console.log('  Popularity score:', popularityScore.toFixed(3));
      console.log('  Final score:', finalScore.toFixed(3));

      return {
        group_id: group._id.toString(),
        name: group.name,
        subject: group.subject,
        difficulty: group.difficulty || 'beginner',
        members_count: group.members?.length || 0,
        score: Math.round(finalScore * 100) / 100
      };
    });

    // Apply qualification rule: Only groups with finalScore >= 0.45 (45% threshold)
    const qualifiedRecommendations = recommendations.filter(rec => {
      const passes = rec.score >= 0.45;
      console.log(`\n${rec.name}: Score ${rec.score} - ${passes ? 'PASS' : 'FAIL'}`);
      return passes;
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total groups evaluated: ${recommendations.length}`);
    console.log(`Qualified (>= 45%): ${qualifiedRecommendations.length}`);
    
    // Sort by score and limit to 6 groups maximum
    const finalRecommendations = qualifiedRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    console.log(`Final recommendations: ${finalRecommendations.length}`);
    console.log('=== END ===\n');

    res.json({
      success: true,
      data: finalRecommendations,
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