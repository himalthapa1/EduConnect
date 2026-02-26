import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getPreferences,
  updatePreferences,
  createTestNotification
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Test notification (for debugging)
router.post('/test', createTestNotification);

// Get notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Delete all read notifications
router.delete('/read/all', deleteAllRead);

// Get notification preferences
router.get('/preferences', getPreferences);

// Update notification preferences
router.put('/preferences', updatePreferences);

export default router;
