import { useRef, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import './NotificationList.css';

const NotificationList = ({
  notifications,
  loading,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
  bellButtonRef
}) => {
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking the bell button or the dropdown itself
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        bellButtonRef?.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, bellButtonRef]);

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button
            className="mark-all-read-btn"
            onClick={onMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
