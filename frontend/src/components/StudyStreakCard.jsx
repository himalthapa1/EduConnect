import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../ui/icons';
import './StudyStreakCard.css';

const StudyStreakCard = () => {
  const { user, token } = useAuth();
  const [streak, setStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.data.user.studyStreak) {
        setStreak(data.data.user.studyStreak);
      }
    } catch (err) {
      console.error('Failed to fetch streak:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/api/users/study-streak`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStreak(data.data.studyStreak);
      }
    } catch (err) {
      console.error('Failed to update streak:', err);
    }
  };

  const getBadge = (streakCount) => {
    if (streakCount >= 100) return { emoji: '🏆', text: 'Legend', color: '#fbbf24' };
    if (streakCount >= 30) return { emoji: '💎', text: 'Diamond', color: '#60a5fa' };
    if (streakCount >= 7) return { emoji: '🔥', text: 'On Fire', color: '#f97316' };
    return { emoji: '⭐', text: 'Getting Started', color: '#a78bfa' };
  };

  const badge = getBadge(streak.currentStreak);

  if (loading) {
    return (
      <div className="streak-card">
        <div className="streak-loading">Loading streak...</div>
      </div>
    );
  }

  return (
    <div className="streak-card">
      <div className="streak-header">
        <h3>Study Streak</h3>
        <span className="streak-badge" style={{ background: badge.color }}>
          {badge.emoji} {badge.text}
        </span>
      </div>

      <div className="streak-content">
        <div className="streak-stats">
          <div className="streak-stat-item">
            <div className="streak-icon">
              <Icons.flame size={28} color="#f97316" />
            </div>
            <div className="streak-info">
              <div className="streak-number">{streak.currentStreak}</div>
              <div className="streak-label">Current</div>
            </div>
          </div>

          <div className="streak-divider"></div>

          <div className="streak-stat-item">
            <div className="streak-icon">
              <Icons.star size={28} color="#fbbf24" />
            </div>
            <div className="streak-info">
              <div className="streak-number">{streak.longestStreak}</div>
              <div className="streak-label">Best</div>
            </div>
          </div>
        </div>

        <button className="streak-update-btn" onClick={updateStreak}>
          <Icons.check size={16} />
          Mark Today as Studied
        </button>

        <div className="streak-milestones">
          <div className="milestone-title">Next Milestones</div>
          <div className="milestone-list">
            {streak.currentStreak < 7 && (
              <div className="milestone-item">
                <span>🔥 7 days</span>
                <span className="milestone-progress">{streak.currentStreak}/7</span>
              </div>
            )}
            {streak.currentStreak < 30 && (
              <div className="milestone-item">
                <span>💎 30 days</span>
                <span className="milestone-progress">{streak.currentStreak}/30</span>
              </div>
            )}
            {streak.currentStreak < 100 && (
              <div className="milestone-item">
                <span>🏆 100 days</span>
                <span className="milestone-progress">{streak.currentStreak}/100</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyStreakCard;
