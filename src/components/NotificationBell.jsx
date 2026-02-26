import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import NotificationList from './NotificationList';
import './NotificationBell.css';

const NotificationBell = ({ socket, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const bellButtonRef = useRef(null);
  const location = useLocation();

  // Debug: Log props
  useEffect(() => {
    console.log('NotificationBell: Props received:', { socket: !!socket, userId });
  }, [socket, userId]);

  // Fetch initial notifications (refetch when location changes)
  useEffect(() => {
    if (!userId) {
      console.log('NotificationBell: No userId provided');
      return;
    }

    console.log('NotificationBell: Fetching notifications for user:', userId);

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:3004/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        console.log('NotificationBell: Fetched notifications:', data);
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId, location.pathname]); // Added location.pathname to refetch on navigation

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) {
      console.log('NotificationBell: No socket connection');
      return;
    }

    console.log('NotificationBell: Socket connected, listening for notifications');

    const handleNotification = (data) => {
      console.log('NotificationBell: Received notification:', data);
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(data.unreadCount);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(data.notification.title, {
          body: data.notification.message,
          icon: '/vite.svg'
        });
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  // Request browser notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:3004/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`http://localhost:3004/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await fetch(`http://localhost:3004/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="notification-bell-container">
      <button
        ref={bellButtonRef}
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <NotificationList
          notifications={notifications}
          loading={loading}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
          onClose={() => setShowDropdown(false)}
          bellButtonRef={bellButtonRef}
        />
      )}
    </div>
  );
};

export default NotificationBell;
