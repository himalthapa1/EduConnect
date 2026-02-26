import { useNavigate } from 'react-router-dom';
import { FaTrash, FaCircle } from 'react-icons/fa';
import { Icons } from '../ui/icons';
import './NotificationItem.css';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'group_join':
        return <Icons.users size={20} />;
      case 'session_join':
        return <Icons.calendar size={20} />;
      case 'session_reminder':
        return <Icons.clock size={20} />;
      case 'session_updated':
        return <Icons.edit size={20} />;
      case 'session_cancelled':
        return <Icons.close size={20} />;
      case 'group_message':
        return <Icons.chat size={20} />;
      case 'resource_added':
        return <Icons.file size={20} />;
      case 'achievement_unlocked':
        return <Icons.star size={20} />;
      case 'system':
        return <Icons.settings size={20} />;
      default:
        return <Icons.checkCircle size={20} />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  return (
    <div
      className={`notification-item ${!notification.read ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
      onClick={handleClick}
    >
      <div className="notification-icon">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="notification-content">
        <div className="notification-title">
          {notification.title}
          {!notification.read && <FaCircle className="unread-dot" />}
        </div>
        <div className="notification-message">{notification.message}</div>
        <div className="notification-time">{formatTime(notification.createdAt)}</div>
      </div>

      <button
        className="notification-delete"
        onClick={handleDelete}
        aria-label="Delete notification"
      >
        <FaTrash />
      </button>
    </div>
  );
};

export default NotificationItem;
