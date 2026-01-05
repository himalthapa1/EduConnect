import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationsAPI, groupsAPI } from '../utils/api';
import './GroupRecommendations.css';

const GroupRecommendations = ({ limit = 5, showHeader = true, compact = false }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [limit]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await recommendationsAPI.getGroupRecommendations({ limit });
      setRecommendations(response.data.data || []);
    } catch (error) {
      console.error('Error loading group recommendations:', error);
      setError('Unable to load recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId, event) => {
    event.stopPropagation();
    try {
      await groupsAPI.joinGroup(groupId);
      // Refresh recommendations after joining
      loadRecommendations();
      // Optionally navigate to the group
      navigate(`/groups`);
    } catch (error) {
      console.error('Error joining group:', error);
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
      case 'beginner': return '🌱';
      case 'intermediate': return '⚡';
      case 'advanced': return '🚀';
      default: return '📚';
    }
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
          <h3>🎯 Recommended for You</h3>
          <p>Groups based on your interests and activity</p>
        </div>
      )}

      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div
            key={rec.group_id || index}
            className="recommendation-card"
            onClick={() => handleViewGroup(rec.group_id)}
          >
            <div className="recommendation-content">
              <div className="recommendation-main">
                <h4 className="group-name">{rec.name}</h4>
                <p className="group-subject">{rec.subject}</p>
                <div className="group-meta">
                  <span className="difficulty" style={{ color: getDifficultyColor(rec.difficulty) }}>
                    {getDifficultyIcon(rec.difficulty)} {rec.difficulty}
                  </span>
                  <span className="members-count">
                    👥 {rec.members_count} members
                  </span>
                </div>
              </div>

              <div className="recommendation-score">
                <div className="score-badge">
                  {rec.score.toFixed(1)}
                </div>
                <span className="score-label">match</span>
              </div>
            </div>

            <div className="recommendation-actions">
              <button
                onClick={(e) => handleJoinGroup(rec.group_id, e)}
                className="join-btn"
              >
                Join Group
              </button>
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
