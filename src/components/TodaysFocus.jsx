import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import './TodaysFocus.css';

const TodaysFocus = () => {
  const navigate = useNavigate();
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodaysSessions();
  }, []);

  const loadTodaysSessions = async () => {
    try {
      const response = await sessionsAPI.getMySessions();
      const allSessions = [...response.data.data.organized, ...response.data.data.joined];
      
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const todaySessions = allSessions.filter(session => {
        const sessionDate = new Date(session.date).toISOString().split('T')[0];
        return sessionDate === todayString;
      });

      setTodaysSessions(todaySessions);
    } catch (error) {
      console.error('Error loading today\'s sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCreateSession = () => {
    navigate('/sessions');
  };

  const handleJoinSession = (sessionId) => {
    navigate(`/sessions/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="todays-focus-container">
        <div className="focus-header">
          <h3><Icons.target size={18} /> Today's Focus</h3>
        </div>
        <div className="loading-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todays-focus-container">
      <div className="focus-header">
        <h3><Icons.target size={18} /> Today's Focus</h3>
      </div>
      
      <div className="focus-content">
        {todaysSessions.length > 0 ? (
          <div className="todays-sessions">
            <p className="sessions-count">{todaysSessions.length} session{todaysSessions.length > 1 ? 's' : ''} today</p>
            <div className="sessions-list">
              {todaysSessions.map(session => (
                <div key={session._id} className="focus-session-card">
                  <div className="session-info">
                    <h4>{session.title}</h4>
                    <p className="session-subject">{session.subject}</p>
                    <div className="session-time">
                      <Icons.clock size={14} />
                      <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoinSession(session._id)}
                    className="join-session-btn"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-focus-content">
            <div className="no-focus-icon">
              <Icons.calendar size={32} />
            </div>
            <h4>No sessions scheduled for today</h4>
            <p>Start your productive day by creating a study session</p>
            <button onClick={handleCreateSession} className="create-focus-btn">
              <Icons.add size={16} />
              Create Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysFocus;