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


  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await recommendationsAPI.getGroupRecommendations({ limit });
      const backendGroups = response.data.data || [];
      
      // Use backend data directly (transformation now handled by backend)
      setRecommendations(backendGroups);
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

  const formatMemberCount = (count) => {
    if (count == null || count === undefined) {
      return '0';
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getRecommendationBadge = (score) => {
    if (score >= 0.8) return { text: '⭐ Recommended', color: '#28a745' };
    if (score >= 0.6) return { text: '👍 Good match', color: '#ffc107' };
    return null; // No badge for low scores
  };

  const getMatchPercentage = (score) => {
    return Math.round((score || 0) * 100);
  };

  const getExplanationText = (group) => {
    const explanations = [];
    
    // Interest match explanation
    if (group.score >= 0.7) {
      explanations.push('Matches your interests');
    }
    
    // Popularity explanation
    if (group.members_count >= 50) {
      explanations.push('Popular among students');
    }
    
    // Activity explanation
    if (group.activity_score >= 100) {
      explanations.push('High weekly activity');
    }
    
    return explanations.slice(0, 2); // Limit to 2 explanations
  };

  const getGroupLeaveRatingModal = () => {
    // This will be implemented in Phase 3
    return null;
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
            key={group.group_id || index}
            className="recommendation-card"
            onClick={() => handleViewGroup(group.group_id)}
          >
            <div className="recommendation-content">
              <div className="recommendation-main">
                <h4 className="group-name">{group.name}</h4>
                <p className="group-category uppercase">{group.category}</p>
                {group.description && (
                  <p className="group-description">{group.description}</p>
                )}
                <div className="group-meta">
                  <span className="difficulty" style={{ color: getDifficultyColor(group.difficulty) }}>
                    {getDifficultyIcon(group.difficulty)} {group.difficulty}
                  </span>
                  <span className="members-count">
                    <Icons.users size={14} /> {formatMemberCount(group.members_count || group.memberCount || 0)}
                  </span>
                </div>
              </div>

              <div className="recommendation-score">
                <div className="match-percentage">
                  <span className="percentage-value">{getMatchPercentage(group.score)}%</span>
                  <span className="percentage-label">match</span>
                </div>
                {getRecommendationBadge(group.score) && (
                  <div className="recommendation-badge" style={{ color: getRecommendationBadge(group.score).color }}>
                    {getRecommendationBadge(group.score).text}
                  </div>
                )}
                {group.rating > 0 && (
                  <div className="rating-info">
                    <span className="rating-value">{formatRating(group.rating)}</span>
                    <span className="rating-label">⭐ rating</span>
                  </div>
                )}
                {getExplanationText(group).length > 0 && (
                  <div className="explanation-text">
                    {getExplanationText(group).map((explanation, idx) => (
                      <span key={idx} className="explanation-item">
                        {explanation}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="recommendation-actions">
              {user?.joinedGroups?.includes(group.group_id) ? (
                <button
                  className="joined-btn"
                  disabled
                >
                  ✓ Joined
                </button>
              ) : (
                <button
                  onClick={(e) => handleJoinGroup(group.group_id, e)}
                  className="join-btn"
                  disabled={joiningGroupId === group.group_id}
                >
                  {joiningGroupId === group.group_id ? 'Joining...' : 'Join'}
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