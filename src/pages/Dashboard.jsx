import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sessionsAPI, groupsAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import GroupRecommendations from '../components/GroupRecommendations';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    joinedGroups: 0,
    organizedSessions: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sessionsRes, mySessionsRes, groupsRes] = await Promise.all([
        sessionsAPI.getSessions({ limit: 5 }),
        sessionsAPI.getMySessions(),
        groupsAPI.getMyGroups()
      ]);

      const allSessions = sessionsRes.data.data.sessions;
      const mySessions = mySessionsRes.data.data;
      const myGroups = groupsRes.data.data.groups || [];

      // Calculate stats
      const now = new Date();
      const upcoming = allSessions.filter(session => new Date(session.date) > now);
      const organized = mySessions.organized.length;
      const joined = mySessions.joined.length;

      setStats({
        totalSessions: allSessions.length,
        upcomingSessions: upcoming.length,
        joinedGroups: myGroups.length,
        organizedSessions: organized
      });

      setUpcomingSessions(upcoming.slice(0, 3));
      setRecentActivity([...mySessions.organized, ...mySessions.joined]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewSessions = () => {
    navigate('/sessions');
  };

  const handleCreateSession = () => {
    navigate('/sessions');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="header-title"><Icons.trendingUp size={24} /> Dashboard</h1>
          <p className="header-subtitle">Welcome back, {user?.username}!</p>
        </div>
        <div className="header-actions">
          <button onClick={handleCreateSession} className="create-session-btn">
            + New Session
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><Icons.calendar size={20} /></div>
              <div className="stat-content">
                <h3>{stats.totalSessions}</h3>
                <p>Total Sessions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Icons.clock size={20} /></div>
              <div className="stat-content">
                <h3>{stats.upcomingSessions}</h3>
                <p>Upcoming Sessions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Icons.users size={20} /></div>
              <div className="stat-content">
                <h3>{stats.joinedGroups}</h3>
                <p>Study Groups</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Icons.checkCircle size={20} /></div>
              <div className="stat-content">
                <h3>{stats.organizedSessions}</h3>
                <p>My Sessions</p>
              </div>
            </div>
          </div>
        </section>

        <div className="dashboard-content">
          {/* Upcoming Sessions */}
          <section className="upcoming-sessions-section">
            <div className="section-header">
              <h2>Upcoming Sessions</h2>
              <button onClick={handleViewSessions} className="view-all-btn">
                View All →
              </button>
            </div>
            <div className="sessions-list">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map(session => (
                  <div key={session._id} className="session-card">
                    <div className="session-info">
                      <h4>{session.title}</h4>
                      <p className="session-subject">
                        {session.subject}
                        {session.group && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                          • {session.group.name}
                        </span>}
                      </p>
                      <div className="session-details">
                        <span><Icons.calendar size={14} /> {formatDate(session.date)}</span>
                        <span><Icons.clock size={14} /> {formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                        <span><Icons.file size={14} /> {session.location}</span>
                      </div>
                    </div>
                    <div className="session-participants">
                      <span>{session.participants.length}/{session.maxParticipants} joined</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No upcoming sessions</p>
                  <button onClick={handleCreateSession} className="create-first-btn">
                    Create Your First Session
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="recent-activity-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map(session => (
                  <div key={session._id} className="activity-item">
                    <div className="activity-icon">
                      {session.organizer._id === user?.id ? <Icons.edit size={16} /> : <Icons.check size={16} />}
                    </div>
                    <div className="activity-content">
                      <p>
                        {session.organizer._id === user?.id
                          ? `You created "${session.title}"`
                          : `You joined "${session.title}"`
                        }
                      </p>
                      <span className="activity-date">
                        {formatDate(session.date)} at {formatTime(session.startTime)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </section>

          {/* Group Recommendations */}
          <GroupRecommendations limit={3} />
        </div>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button onClick={handleCreateSession} className="action-btn primary">
              <span className="action-icon"><Icons.calendar size={18} /></span>
              <span>Schedule Session</span>
            </button>
            <button onClick={() => navigate('/study-with-me')} className="action-btn primary">
              <span className="action-icon"><Icons.book size={18} /></span>
              <span>Study With Me</span>
            </button>
            <button onClick={() => navigate('/groups')} className="action-btn secondary">
              <span className="action-icon"><Icons.users size={18} /></span>
              <span>Browse Groups</span>
            </button>
            <button onClick={() => navigate('/profile')} className="action-btn secondary">
              <span className="action-icon"><Icons.settings size={18} /></span>
              <span>Edit Profile</span>
            </button>
            <button onClick={() => navigate('/resources')} className="action-btn secondary">
              <span className="action-icon"><Icons.file size={18} /></span>
              <span>Study Resources</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
