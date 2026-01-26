import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import './TrendingGroups.css';

const TrendingGroups = ({ limit = 6, showHeader = true, compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trendingGroups, setTrendingGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(null);

  useEffect(() => {
    loadTrendingGroups();
  }, [limit]);

  const loadTrendingGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await groupsAPI.getTrendingGroups({ limit });
      setTrendingGroups(response.data.data.groups || []);
    } catch (error) {
      console.error('Error loading trending groups:', error);
      const errorMessage = error.response?.data?.message ||
                          'Failed to load trending groups. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId, event) => {
    event.stopPropagation();

    if (!user) {
      setJoinError('Please log in to join groups');
      return;
    }

    setJoiningGroupId(groupId);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      await groupsAPI.joinGroup(groupId);
      setJoinSuccess('Successfully joined the group!');
      // Refresh trending groups after joining
      loadTrendingGroups();
      // Navigate to groups page after successful join
      setTimeout(() => navigate('/groups'), 1000);
    } catch (error) {
      console.error('Error joining group:', error);
      const errorMessage = error.response?.data?.error?.message ||
                          error.response?.data?.message ||
                          'Failed to join group. Please try again.';
      setJoinError(errorMessage);
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return <Icons.book size={14} />;
      case 'intermediate': return <Icons.timer size={14} />;
      case 'advanced': return <Icons.trendingUp size={14} />;
      default: return <Icons.book size={14} />;
    }
  };

  const formatMemberCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const formatRating = (rating) => {
    return rating.toFixed(1);
  };

  if (loading) {
    return (
      <div className={`trending-groups ${compact ? 'compact' : ''}`}>
        {showHeader && (
          <div className="trending-header">
            <h3>Trending Groups</h3>
          </div>
        )}
        <div className="loading-state">
          <div className="loading-spinner small"></div>
          <p>Finding trending groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`trending-groups ${compact ? 'compact' : ''}`}>
        {showHeader && (
          <div className="trending-header">
            <h3>Trending Groups</h3>
          </div>
        )}
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadTrendingGroups} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (trendingGroups.length === 0) {
    return (
      <div className={`trending-groups ${compact ? 'compact' : ''}`}>
        {showHeader && (
          <div className="trending-header">
            <h3>Trending Groups</h3>
          </div>
        )}
        <div className="empty-state">
          <p>No trending groups available</p>
          <p className="empty-subtitle">Check back later for popular groups!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`trending-groups ${compact ? 'compact' : ''}`}>
      {showHeader && (
        <div className="trending-header">
          <h3><Icons.flame size={20} /> Trending Groups</h3>
          <p>Popular groups based on activity and engagement</p>
        </div>
      )}

      {/* Join feedback messages */}
      {joinError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {joinError}
        </div>
      )}
      {joinSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {joinSuccess}
        </div>
      )}

      <div className={`trending-list ${compact ? 'horizontal-scroll' : 'grid-layout'}`}>
        {trendingGroups.map((group, index) => (
          <div
            key={group._id || index}
            className="trending-card"
            onClick={() => handleViewGroup(group._id)}
          >
            <div className="trending-content">
              <div className="trending-main">
                <h4 className="group-name">{group.name}</h4>
                <p className="group-category">{group.subject}</p>
                <div className="group-meta">
                  <span className="difficulty" style={{ color: getDifficultyColor(group.difficulty) }}>
                    {getDifficultyIcon(group.difficulty)} {group.difficulty}
                  </span>
                  <span className="members-count">
                    <Icons.users size={14} /> {formatMemberCount(group.memberCount)}
                  </span>
                </div>
              </div>

              <div className="trending-stats">
                <div className="rating-info">
                  <span className="rating-value">{formatRating(group.averageRating)}</span>
                  <span className="rating-label">⭐ rating</span>
                </div>
              </div>
            </div>

            <div className="trending-actions">
              {user?.joinedGroups?.includes(group._id) ? (
                <button
                  className="joined-btn"
                  disabled
                >
                  ✓ Joined
                </button>
              ) : (
                <button
                  onClick={(e) => handleJoinGroup(group._id, e)}
                  className="join-btn"
                  disabled={joiningGroupId === group._id}
                >
                  {joiningGroupId === group._id ? 'Joining...' : 'Join'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {trendingGroups.length >= limit && (
        <div className="view-more">
          <button onClick={() => navigate('/groups')} className="view-more-btn">
            View All Groups →
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingGroups;