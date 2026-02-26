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

// Change user password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Check password complexity (at least one uppercase, one lowercase, one number)
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Get user with password for verification
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while changing password'
    });
  }
};


// Update study streak
export const updateStudyStreak = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudyDate = user.studyStreak?.lastStudyDate 
      ? new Date(user.studyStreak.lastStudyDate) 
      : null;

    if (lastStudyDate) {
      lastStudyDate.setHours(0, 0, 0, 0);
    }

    // Check if already studied today
    if (lastStudyDate && lastStudyDate.getTime() === today.getTime()) {
      return res.json({
        success: true,
        message: 'Streak already updated today',
        data: {
          studyStreak: user.studyStreak
        }
      });
    }

    // Initialize studyStreak if it doesn't exist
    if (!user.studyStreak) {
      user.studyStreak = {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null
      };
    }

    // Check if streak continues (yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastStudyDate && lastStudyDate.getTime() === yesterday.getTime()) {
      // Continue streak
      user.studyStreak.currentStreak += 1;
    } else if (!lastStudyDate || lastStudyDate.getTime() < yesterday.getTime()) {
      // Reset streak
      user.studyStreak.currentStreak = 1;
    }

    // Update longest streak
    if (user.studyStreak.currentStreak > user.studyStreak.longestStreak) {
      user.studyStreak.longestStreak = user.studyStreak.currentStreak;
    }

    user.studyStreak.lastStudyDate = today;
    await user.save();

    res.json({
      success: true,
      message: 'Study streak updated',
      data: {
        studyStreak: user.studyStreak
      }
    });
  } catch (err) {
    console.error('Update study streak error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while updating streak'
    });
  }
};

// Get user profile with streak
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          collegeName: user.collegeName,
          currentYear: user.currentYear,
          preferences: user.preferences,
          studyStreak: user.studyStreak || { currentStreak: 0, longestStreak: 0, lastStudyDate: null },
          onboarding: user.onboarding
        }
      }
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching profile'
    });
  }
};


// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Get user and delete old profile picture if exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldFilePath = path.join(__dirname, '..', user.profilePicture.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update user with new profile picture URL
    const profilePictureUrl = `/uploads/${req.file.filename}`;
    user.profilePicture = profilePictureUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: profilePictureUrl
      }
    });
  } catch (err) {
    console.error('Upload profile picture error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error while uploading profile picture'
    });
  }
};
