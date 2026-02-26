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


/* =========================
   GET USER ANALYTICS
========================= */
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await User.findById(userId)
      .populate('joinedGroups', 'name createdAt')
      .populate('attendedSessions', 'title date startTime endTime');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Import models
    const StudyWithMeSession = (await import('../models/StudyWithMeSession.js')).default;
    const GroupMessage = (await import('../models/GroupMessage.js')).default;
    const GroupResource = (await import('../models/GroupResource.js')).default;
    const GroupMember = (await import('../models/GroupMember.js')).default;

    // Get study with me sessions
    const studySessions = await StudyWithMeSession.find({
      userId,
      status: 'completed'
    }).sort({ createdAt: -1 });

    // Calculate total study hours and sessions
    const totalStudyMinutes = studySessions.reduce((sum, session) => {
      return sum + (session.actualDuration || session.studyMinutes || 0);
    }, 0);
    const totalStudyHours = Math.round(totalStudyMinutes / 60 * 10) / 10;
    const totalStudySessions = studySessions.length;

    // Calculate average session duration
    const avgSessionDuration = totalStudySessions > 0 
      ? Math.round((totalStudyMinutes / totalStudySessions) / 60 * 10) / 10 
      : 0;

    // Get most studied subjects
    const subjectCounts = {};
    studySessions.forEach(session => {
      const subject = session.subject || 'Unknown';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });
    const topSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([subject, count]) => ({ subject, count }));

    // Get study hours for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSessions = studySessions.filter(s => s.createdAt >= sevenDaysAgo);
    const studyHoursByDay = {};
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      studyHoursByDay[dateStr] = 0;
    }
    
    recentSessions.forEach(session => {
      const dateStr = session.createdAt.toISOString().split('T')[0];
      if (studyHoursByDay[dateStr] !== undefined) {
        studyHoursByDay[dateStr] += (session.actualDuration || session.studyMinutes || 0) / 60;
      }
    });

    // Get messages sent
    const messagesSent = await GroupMessage.countDocuments({ senderId: userId });

    // Get resources shared
    const resourcesShared = await GroupResource.countDocuments({ addedBy: userId });

    // Get groups joined this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Use GroupMember to get actual join dates
    const groupsJoinedThisWeek = await GroupMember.countDocuments({
      userId,
      createdAt: { $gte: oneWeekAgo }
    });

    // Get sessions attended this week
    const sessionsThisWeek = user.attendedSessions.filter(s => 
      s.date && new Date(s.date) >= oneWeekAgo
    ).length;

    // Calculate study hours this week
    const studyHoursThisWeek = recentSessions.reduce((sum, session) => {
      return sum + (session.actualDuration || session.studyMinutes || 0) / 60;
    }, 0);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudyHours,
          totalStudySessions,
          avgSessionDuration,
          totalGroups: user.joinedGroups.length,
          totalSessions: user.attendedSessions.length,
          messagesSent,
          resourcesShared,
          activityScore: user.activityScore || 0,
          currentStreak: user.studyStreak?.currentStreak || 0,
          longestStreak: user.studyStreak?.longestStreak || 0
        },
        thisWeek: {
          studyHours: Math.round(studyHoursThisWeek * 10) / 10,
          studySessions: recentSessions.length,
          groupsJoined: groupsJoinedThisWeek,
          sessionsAttended: sessionsThisWeek
        },
        studyHoursByDay: Object.entries(studyHoursByDay).map(([date, hours]) => ({
          date,
          hours: Math.round(hours * 10) / 10,
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        })),
        topSubjects,
        recentActivity: {
          lastStudySession: studySessions[0] ? {
            subject: studySessions[0].subject,
            duration: Math.round((studySessions[0].actualDuration || studySessions[0].studyMinutes) / 60 * 10) / 10,
            date: studySessions[0].createdAt
          } : null,
          recentGroups: user.joinedGroups.slice(0, 5).map(g => ({
            id: g._id,
            name: g.name,
            joinedAt: g.createdAt
          })),
          recentStudySessions: studySessions.slice(0, 5).map(s => ({
            subject: s.subject,
            duration: Math.round((s.actualDuration || s.studyMinutes) / 60 * 10) / 10,
            date: s.createdAt
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message
    });
  }
};
