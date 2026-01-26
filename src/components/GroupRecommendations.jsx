import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { recommendationsAPI, groupsAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import './GroupRecommendations.css';

const GroupRecommendations = ({ limit = 5, showHeader = true, compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [limit]);

  // Helper function to normalize level values
  const normalizeLevel = (level) => {
    const normalized = String(level || "").toLowerCase().trim();
    const levelMap = {
      'beginner': 'beginner',
      'begining': 'beginner', // Common typo
      'intermediate': 'intermediate',
      'advanced': 'advanced',
      'expert': 'advanced',
      'pro': 'advanced'
    };
    return levelMap[normalized] || 'beginner';
  };

  // Helper function to normalize category values
  const normalizeCategory = (category) => {
    if (!category) return 'General';
    const normalized = String(category).trim();
    return normalized.length > 0 ? normalized : 'General';
  };

  // Helper function to normalize members count
  const normalizeMembersCount = (membersCount) => {
    if (membersCount == null || membersCount === '') return 0;
    const count = Number(membersCount);
    return isNaN(count) || count < 0 ? 0 : Math.floor(count);
  };

  // Transform backend group data to standardized format
  const transformGroup = (backendGroup) => {
    if (!backendGroup) return null;

    const id = backendGroup.group_id || backendGroup.id || '';
    if (!id) return null;

    return {
      id,
      name: String(backendGroup.name || '').trim() || 'Unnamed Group',
      category: normalizeCategory(backendGroup.subject),
      level: normalizeLevel(backendGroup.difficulty),
      membersCount: normalizeMembersCount(backendGroup.members_count),
      rating: backendGroup.score || null
    };
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await recommendationsAPI.getGroupRecommendations({ limit });
      const backendGroups = response.data.data || [];
      
      // Transform backend data to standardized Group interface
      const transformedGroups = backendGroups
        .map(transformGroup)
        .filter(group => group !== null);
      
      setRecommendations(transformedGroups);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      console.log('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message ||
                          error.response?.data?.message ||
                          'Failed to load recommendations. Please try again.';
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
      // Refresh recommendations after joining
      loadRecommendations();
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

  const formatRating = (rating) => {
    return rating.toFixed(1);
  };

  if (loading) {
    return (
      <div className={`group-recommendations ${compact ? 'compact' : ''}`}>
        {showHeader && (
          <div className="recommendations-header">
            <h3>Recommended Groups</h3>
          </div>
        )}
        <div className="loading-state">
          <div className="loading-spinner small"></div>
          <p>Finding groups for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`group-recommendations ${compact ? 'compact' : ''}`}>
        {showHeader && (
          <div className="recommendations-header">
            <h3>Recommended Groups</h3>
          </div>
        )}
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadRecommendations} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`group-recommendations ${compact ? 'compact' : ''}`}>
        {showHeader && (
          <div className="recommendations-header">
            <h3>Recommended Groups</h3>
          </div>
        )}
        <div className="empty-state">
          <p>No recommendations available</p>
          <p className="empty-subtitle">Complete more activities to get personalized suggestions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`group-recommendations ${compact ? 'compact' : ''}`}>
      {showHeader && (
        <div className="recommendations-header">
          <h3><Icons.checkCircle size={20} /> Recommended for You</h3>
          <p>Personalized groups based on your interests and activity</p>
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

      <div className={`recommendations-list ${compact ? 'horizontal-scroll' : 'grid-layout'}`}>
        {recommendations.map((group, index) => (
          <div
            key={group.id || index}
            className="recommendation-card"
            onClick={() => handleViewGroup(group.id)}
          >
            <div className="recommendation-content">
              <div className="recommendation-main">
                <h4 className="group-name">{group.name}</h4>
                <p className="group-category uppercase">{group.category}</p>
                <div className="group-meta">
                  <span className="difficulty" style={{ color: getDifficultyColor(group.level) }}>
                    {getDifficultyIcon(group.level)} {group.level}
                  </span>
                  <span className="members-count">
                    <Icons.users size={14} /> {group.membersCount}
                  </span>
                </div>
              </div>

              <div className="recommendation-score">
                <div className="match-percentage">
                  <span className="percentage-value">100%</span>
                  <span className="percentage-label">match</span>
                </div>
                {group.rating > 0 && (
                  <div className="rating-info">
                    <span className="rating-value">{formatRating(group.rating)}</span>
                    <span className="rating-label">⭐ rating</span>
                  </div>
                )}
              </div>
            </div>

            <div className="recommendation-actions">
              {user?.joinedGroups?.includes(group.id) ? (
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

      {recommendations.length >= limit && (
        <div className="view-more">
          <button onClick={() => navigate('/groups')} className="view-more-btn">
            View More Recommendations →
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupRecommendations;
