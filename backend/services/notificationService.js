import Notification from '../models/Notification.js';

class NotificationService {
  /**
   * Create and emit a notification
   */
  static async createNotification(io, data) {
    try {
      const notification = await Notification.createNotification(data);
      
      // Emit to specific user via Socket.IO
      if (io) {
        io.to(`user:${data.recipient}`).emit('notification', {
          notification: notification.toObject(),
          unreadCount: await Notification.getUnreadCount(data.recipient)
        });
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Group member joined notification
   */
  static async notifyGroupJoin(io, { groupId, groupName, userId, userName, creatorId }) {
    if (creatorId.toString() === userId.toString()) return; // Don't notify self
    
    return this.createNotification(io, {
      recipient: creatorId,
      sender: userId,
      type: 'group_join',
      title: 'New Member Joined',
      message: `${userName} joined your group "${groupName}"`,
      data: { groupId, userId },
      link: `/groups/${groupId}`,
      priority: 'medium'
    });
  }

  /**
   * New group message notification
   */
  static async notifyGroupMessage(io, { groupId, groupName, senderId, senderName, members, messagePreview }) {
    const notifications = members
      .filter(memberId => memberId.toString() !== senderId.toString())
      .map(memberId => ({
        recipient: memberId,
        sender: senderId,
        type: 'group_message',
        title: `New message in ${groupName}`,
        message: `${senderName}: ${messagePreview}`,
        data: { groupId, senderId },
        link: `/groups/${groupId}`,
        priority: 'low'
      }));

    // Batch create notifications
    const created = await Notification.insertMany(notifications);
    
    // Emit to all members
    if (io) {
      for (const notification of created) {
        io.to(`user:${notification.recipient}`).emit('notification', {
          notification: notification.toObject(),
          unreadCount: await Notification.getUnreadCount(notification.recipient)
        });
      }
    }
    
    return created;
  }

  /**
   * Session reminder notification (15 minutes before)
   */
  static async notifySessionReminder(io, { sessionId, sessionTitle, participants, startTime }) {
    const notifications = participants.map(userId => ({
      recipient: userId,
      type: 'session_reminder',
      title: 'Session Starting Soon',
      message: `"${sessionTitle}" starts in 15 minutes`,
      data: { sessionId, startTime },
      link: `/sessions/${sessionId}`,
      priority: 'high'
    }));

    const created = await Notification.insertMany(notifications);
    
    if (io) {
      for (const notification of created) {
        io.to(`user:${notification.recipient}`).emit('notification', {
          notification: notification.toObject(),
          unreadCount: await Notification.getUnreadCount(notification.recipient)
        });
      }
    }
    
    return created;
  }

  /**
   * User joined session notification
   */
  static async notifySessionJoin(io, { sessionId, sessionTitle, userId, userName, organizerId }) {
    if (organizerId.toString() === userId.toString()) return;
    
    return this.createNotification(io, {
      recipient: organizerId,
      sender: userId,
      type: 'session_join',
      title: 'New Session Participant',
      message: `${userName} joined your session "${sessionTitle}"`,
      data: { sessionId, userId },
      link: `/sessions/${sessionId}`,
      priority: 'medium'
    });
  }

  /**
   * Session cancelled notification
   */
  static async notifySessionCancelled(io, { sessionId, sessionTitle, participants, reason }) {
    const notifications = participants.map(userId => ({
      recipient: userId,
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: `"${sessionTitle}" has been cancelled${reason ? `: ${reason}` : ''}`,
      data: { sessionId, reason },
      link: '/sessions',
      priority: 'urgent'
    }));

    const created = await Notification.insertMany(notifications);
    
    if (io) {
      for (const notification of created) {
        io.to(`user:${notification.recipient}`).emit('notification', {
          notification: notification.toObject(),
          unreadCount: await Notification.getUnreadCount(notification.recipient)
        });
      }
    }
    
    return created;
  }

  /**
   * Session updated notification
   */
  static async notifySessionUpdated(io, { sessionId, sessionTitle, participants, changes }) {
    const notifications = participants.map(userId => ({
      recipient: userId,
      type: 'session_updated',
      title: 'Session Updated',
      message: `"${sessionTitle}" has been updated: ${changes}`,
      data: { sessionId, changes },
      link: `/sessions/${sessionId}`,
      priority: 'medium'
    }));

    const created = await Notification.insertMany(notifications);
    
    if (io) {
      for (const notification of created) {
        io.to(`user:${notification.recipient}`).emit('notification', {
          notification: notification.toObject(),
          unreadCount: await Notification.getUnreadCount(notification.recipient)
        });
      }
    }
    
    return created;
  }

  /**
   * Resource added notification
   */
  static async notifyResourceAdded(io, { groupId, groupName, resourceTitle, userId, userName, members }) {
    const notifications = members
      .filter(memberId => memberId.toString() !== userId.toString())
      .map(memberId => ({
        recipient: memberId,
        sender: userId,
        type: 'resource_added',
        title: 'New Resource Added',
        message: `${userName} added "${resourceTitle}" to ${groupName}`,
        data: { groupId, resourceTitle },
        link: `/groups/${groupId}`,
        priority: 'low'
      }));

    const created = await Notification.insertMany(notifications);
    
    if (io) {
      for (const notification of created) {
        io.to(`user:${notification.recipient}`).emit('notification', {
          notification: notification.toObject(),
          unreadCount: await Notification.getUnreadCount(notification.recipient)
        });
      }
    }
    
    return created;
  }

  /**
   * Achievement unlocked notification
   */
  static async notifyAchievement(io, { userId, achievementTitle, achievementDescription, icon }) {
    return this.createNotification(io, {
      recipient: userId,
      type: 'achievement_unlocked',
      title: '🎉 Achievement Unlocked!',
      message: `${achievementTitle}: ${achievementDescription}`,
      data: { achievementTitle, icon },
      link: '/profile',
      priority: 'medium'
    });
  }

  /**
   * System notification
   */
  static async notifySystem(io, { userId, title, message, link, priority = 'medium' }) {
    return this.createNotification(io, {
      recipient: userId,
      type: 'system',
      title,
      message,
      link,
      priority
    });
  }

  /**
   * Broadcast to all users
   */
  static async broadcastToAll(io, { title, message, link, priority = 'medium' }) {
    // This would need to be optimized for large user bases
    // Consider using a job queue for production
    const User = (await import('../models/User.js')).default;
    const users = await User.find({}, '_id');
    
    const notifications = users.map(user => ({
      recipient: user._id,
      type: 'system',
      title,
      message,
      link,
      priority
    }));

    const created = await Notification.insertMany(notifications);
    
    if (io) {
      io.emit('broadcast_notification', {
        title,
        message,
        link,
        priority
      });
    }
    
    return created;
  }
}

export default NotificationService;
