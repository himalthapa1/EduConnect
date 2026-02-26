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

    // Listen for analytics refresh events
    const handleRefresh = () => {
      loadAnalytics();
    };

    window.addEventListener('refreshAnalytics', handleRefresh);

    // Refresh analytics every 30 seconds to catch updates
    const interval = setInterval(() => {
      loadAnalytics();
    }, 30000);

    return () => {
      window.removeEventListener('refreshAnalytics', handleRefresh);
      clearInterval(interval);
    };
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
      <div className="analytics-section">
        <div className="analytics-loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-section">
        <div className="analytics-error">{error}</div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview, thisWeek, studyHoursByDay, topSubjects, recentActivity } = analytics;

  return (
    <section className="analytics-section">
      {/* Section Header */}
      <div className="analytics-section-header">
        <h2>
          <Icons.trendingUp size={20} />
          Your Study Analytics
        </h2>
      </div>

      {/* Row 1: Summary Cards (4 equal columns) */}
      <div className="analytics-row-1">
        <div className="analytics-summary-card">
          <div className="summary-card-icon study-hours">
            <Icons.clock size={20} />
          </div>
          <div className="summary-card-content">
            <div className="summary-card-value">{overview.totalStudyHours}h</div>
            <div className="summary-card-label">Total Study Hours</div>
          </div>
        </div>

        <div className="analytics-summary-card">
          <div className="summary-card-icon study-sessions">
            <Icons.calendar size={20} />
          </div>
          <div className="summary-card-content">
            <div className="summary-card-value">{overview.totalStudySessions}</div>
            <div className="summary-card-label">Study Sessions</div>
          </div>
        </div>

        <div className="analytics-summary-card">
          <div className="summary-card-icon groups">
            <Icons.users size={20} />
          </div>
          <div className="summary-card-content">
            <div className="summary-card-value">{overview.totalGroups}</div>
            <div className="summary-card-label">Groups Joined</div>
          </div>
        </div>

        <div className="analytics-summary-card">
          <div className="summary-card-icon streak">
            <Icons.fire size={20} />
          </div>
          <div className="summary-card-content">
            <div className="summary-card-value">{overview.currentStreak}</div>
            <div className="summary-card-label">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Row 2: Weekly Stats Card (Full Width) */}
      <div className="analytics-row-2">
        <div className="analytics-weekly-card">
          <h3>This Week</h3>
          <div className="weekly-stats-grid">
            <div className="weekly-stat">
              <div className="weekly-stat-value">{thisWeek.studyHours}h</div>
              <div className="weekly-stat-label">Study Hours</div>
            </div>
            <div className="weekly-stat-divider"></div>
            <div className="weekly-stat">
              <div className="weekly-stat-value">{thisWeek.studySessions}</div>
              <div className="weekly-stat-label">Study Sessions</div>
            </div>
            <div className="weekly-stat-divider"></div>
            <div className="weekly-stat">
              <div className="weekly-stat-value">{thisWeek.groupsJoined}</div>
              <div className="weekly-stat-label">Groups Joined</div>
            </div>
            <div className="weekly-stat-divider"></div>
            <div className="weekly-stat">
              <div className="weekly-stat-value">{thisWeek.sessionsAttended}</div>
              <div className="weekly-stat-label">Group Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Study Hours Chart (Full Width) */}
      <div className="analytics-row-3">
        <div className="analytics-chart-card">
          <h3>Study Hours (Last 7 Days)</h3>
          <div className="chart-container">
            <ActivityChart data={studyHoursByDay} />
          </div>
        </div>
      </div>

      {/* Row 4: Performance Metrics (3 equal cards) */}
      <div className="analytics-row-4">
        <div className="analytics-metric-card">
          <h3>Average Session</h3>
          <div className="metric-value">{overview.avgSessionDuration}h</div>
          <div className="metric-label">per study session</div>
        </div>

        <div className="analytics-metric-card">
          <h3>Total Sessions</h3>
          <div className="metric-value">{overview.totalStudySessions}</div>
          <div className="metric-label">completed</div>
        </div>

        <div className="analytics-metric-card">
          <h3>Activity Score</h3>
          <div className="metric-value">{overview.activityScore}</div>
          <div className="metric-label">engagement points</div>
        </div>
      </div>

      {/* Top Subjects (Optional - if data exists) */}
      {topSubjects && topSubjects.length > 0 && (
        <div className="analytics-subjects-row">
          <div className="analytics-subjects-card">
            <h3>Most Studied Subjects</h3>
            <div className="subjects-grid">
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
        </div>
      )}
    </section>
  );
};

export default StudyAnalytics;
