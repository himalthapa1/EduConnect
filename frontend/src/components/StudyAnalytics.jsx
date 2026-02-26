import { useState, useEffect } from 'react';
import { usersAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import ActivityChart from './ActivityChart';
import './StudyAnalytics.css';

const StudyAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAnalytics();
      setAnalytics(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="analytics-error">{error}</div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview, thisWeek, studyHoursByDay, topSubjects, recentActivity } = analytics;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2><Icons.trendingUp size={24} /> Your Study Analytics</h2>
        <p>Track your progress and stay motivated</p>
      </div>

      {/* Overview Stats */}
      <div className="analytics-overview">
        <div className="analytics-stat-card">
          <div className="stat-icon study-hours">
            <Icons.clock size={24} />
          </div>
          <div className="stat-details">
            <h3>{overview.totalStudyHours}h</h3>
            <p>Total Study Hours</p>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon sessions">
            <Icons.calendar size={24} />
          </div>
          <div className="stat-details">
            <h3>{overview.totalStudySessions}</h3>
            <p>Study Sessions</p>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon groups">
            <Icons.users size={24} />
          </div>
          <div className="stat-details">
            <h3>{overview.totalGroups}</h3>
            <p>Study Groups</p>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon streak">
            <Icons.fire size={24} />
          </div>
          <div className="stat-details">
            <h3>{overview.currentStreak}</h3>
            <p>Day Streak</p>
          </div>
        </div>
      </div>

      {/* This Week Summary */}
      <div className="analytics-week-summary">
        <h3>This Week</h3>
        <div className="week-stats">
          <div className="week-stat">
            <span className="week-stat-value">{thisWeek.studyHours}h</span>
            <span className="week-stat-label">Study Hours</span>
          </div>
          <div className="week-stat">
            <span className="week-stat-value">{thisWeek.studySessions}</span>
            <span className="week-stat-label">Study Sessions</span>
          </div>
          <div className="week-stat">
            <span className="week-stat-value">{thisWeek.groupsJoined}</span>
            <span className="week-stat-label">Groups Joined</span>
          </div>
          <div className="week-stat">
            <span className="week-stat-value">{thisWeek.sessionsAttended}</span>
            <span className="week-stat-label">Group Sessions</span>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="analytics-chart-section">
        <h3>Study Hours (Last 7 Days)</h3>
        <ActivityChart data={studyHoursByDay} />
      </div>

      {/* Study With Me Stats */}
      <div className="analytics-study-stats">
        <div className="study-stat-card">
          <h3>Average Session</h3>
          <div className="study-stat-value">{overview.avgSessionDuration}h</div>
          <p>per study session</p>
        </div>
        <div className="study-stat-card">
          <h3>Total Sessions</h3>
          <div className="study-stat-value">{overview.totalStudySessions}</div>
          <p>completed</p>
        </div>
      </div>

      {/* Top Subjects */}
      {topSubjects && topSubjects.length > 0 && (
        <div className="analytics-subjects">
          <h3>Most Studied Subjects</h3>
          <div className="subjects-list">
            {topSubjects.map((item, index) => (
              <div key={index} className="subject-item">
                <div className="subject-rank">{index + 1}</div>
                <div className="subject-info">
                  <span className="subject-name">{item.subject}</span>
                  <span className="subject-count">{item.count} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="analytics-additional">
        <div className="additional-stat">
          <Icons.message size={20} />
          <div>
            <h4>{overview.messagesSent}</h4>
            <p>Messages Sent</p>
          </div>
        </div>
        <div className="additional-stat">
          <Icons.file size={20} />
          <div>
            <h4>{overview.resourcesShared}</h4>
            <p>Resources Shared</p>
          </div>
        </div>
        <div className="additional-stat">
          <Icons.star size={20} />
          <div>
            <h4>{overview.activityScore}</h4>
            <p>Activity Score</p>
          </div>
        </div>
        <div className="additional-stat">
          <Icons.fire size={20} />
          <div>
            <h4>{overview.longestStreak}</h4>
            <p>Longest Streak</p>
          </div>
        </div>
      </div>

      {/* Recent Study Sessions */}
      {recentActivity.recentStudySessions && recentActivity.recentStudySessions.length > 0 && (
        <div className="analytics-recent">
          <h3>Recent Study Sessions</h3>
          <div className="recent-sessions-list">
            {recentActivity.recentStudySessions.map((session, index) => (
              <div key={index} className="recent-session">
                <div className="recent-session-info">
                  <h4>{session.subject}</h4>
                  <p>{session.duration}h • {new Date(session.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyAnalytics;
