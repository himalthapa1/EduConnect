import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../ui/icons';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import NotificationBell from './NotificationBell';
import { FaCalendarPlus } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3004', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Icons.trendingUp size={18} />,
      path: '/dashboard'
    },
    {
      id: 'study-with-me',
      label: 'Study With Me',
      icon: <Icons.book size={18} />,
      path: '/study-with-me'
    },
    {
      id: 'sessions',
      label: 'Study Sessions',
      icon: <Icons.calendar size={18} />,
      path: '/sessions'
    },
    {
      id: 'groups',
      label: 'Study Groups',
      icon: <Icons.users size={18} />,
      path: '/groups'
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: <Icons.file size={18} />,
      path: '/resources'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <Icons.user size={18} />,
      path: '/profile'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleLogout = () => {
    logout();
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon"><Icons.book size={20} /></span>
          {!collapsed && <span className="logo-text">EduConnect</span>}
        </div>
        <div className="header-actions">
          <NotificationBell socket={socket} userId={user?.id || user?._id} />
          <button
            className="calendar-btn"
            onClick={() => navigate('/sessions')}
            title="Calendar & Events"
          >
            <FaCalendarPlus size={18} />
          </button>
        </div>
        <button
          className="collapse-btn desktop-only"
          onClick={() => onToggleCollapse(!collapsed)}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          {user && (
            <>
              <div className="user-avatar">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="user-details">
                  <div className="user-name">{user.username}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              )}
            </>
          )}
        </div>
        <button
          className="logout-btn"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
        >
          <span className="logout-icon"><Icons.logout size={16} /></span>
          {!collapsed && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
