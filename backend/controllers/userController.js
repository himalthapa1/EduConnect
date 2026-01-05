import User from '../models/User.js';

// Set user preferences (onboarding)
export const setPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { interests } = req.body;

    // Validate interests array
    if (!userId || !Array.isArray(interests) || interests.length < 3 || interests.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Please select between 3 and 10 interests'
      });
    }

    // Update user with preferences and mark onboarding as completed
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'preferences.interests': interests,
        'onboarding.completed': true
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          preferences: user.preferences,
          onboarding: user.onboarding
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
