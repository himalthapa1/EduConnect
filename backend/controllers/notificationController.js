import Notification from '../models/Notification.js';

/**
 * Get user's notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch notifications' }
    });
  }
};

/**
 * Get unread count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Notification.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch unread count' }
    });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;
    
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { message: 'Notification not found' }
      });
    }
    
    await notification.markAsRead();
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { notification, unreadCount }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark notification as read' }
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await Notification.markAllAsRead(userId);
    
    res.json({
      success: true,
      data: { message: 'All notifications marked as read' }
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark all as read' }
    });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { message: 'Notification not found' }
      });
    }
    
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { message: 'Notification deleted', unreadCount }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete notification' }
    });
  }
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await Notification.deleteMany({
      recipient: userId,
      read: true
    });
    
    res.json({
      success: true,
      data: { 
        message: 'All read notifications deleted',
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete notifications' }
    });
  }
};

/**
 * Get notification preferences
 */
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const User = (await import('../models/User.js')).default;
    
    const user = await User.findById(userId);
    
    res.json({
      success: true,
      data: {
        preferences: user.notificationPreferences || {
          email: true,
          push: true,
          groupMessages: true,
          sessionReminders: true,
          groupJoins: true,
          resourceAdded: true
        }
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch preferences' }
    });
  }
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;
    const User = (await import('../models/User.js')).default;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true }
    );
    
    res.json({
      success: true,
      data: { preferences: user.notificationPreferences }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update preferences' }
    });
  }
};

/**
 * Create test notification (for debugging)
 */
export const createTestNotification = async (req, res) => {
  try {
    console.log('Creating test notification for user:', req.user.userId);
    
    const io = req.app.get('io');
    if (!io) {
      console.error('Socket.IO instance not found!');
      return res.status(500).json({
        success: false,
        error: { message: 'Socket.IO not initialized' }
      });
    }
    
    const NotificationService = (await import('../services/notificationService.js')).default;
    
    const notification = await NotificationService.createNotification(io, {
      recipient: req.user.userId,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly!',
      link: '/dashboard',
      priority: 'high'
    });
    
    console.log('Test notification created:', notification);
    
    res.json({
      success: true,
      message: 'Test notification created successfully',
      data: { notification }
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create test notification', details: error.message }
    });
  }
};
