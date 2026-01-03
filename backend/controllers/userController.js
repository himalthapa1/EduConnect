import User from '../models/User.js';

// Set user preferences (onboarding)
export const setPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { preferences } = req.body;
    if (!userId || !Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid user or preferences' });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
