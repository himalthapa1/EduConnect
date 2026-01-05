import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SessionCard.css';

function SessionCard({ session, onJoin, onLeave, onComplete, isOrganizer = false, showJoinButton = false, showLeaveButton = false, showCompleteButton = false }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = (timeString || '').split(':');
    const d = new Date();
    d.setHours(parseInt(hours || 0), parseInt(minutes || 0));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getInitials = (text = '') => {
    if (!text) return '';
    return text.split(' ').map(s => s[0]?.toUpperCase() || '').slice(0,2).join('');
  };

  const isUserJoined = session.participants?.some(p => p.user._id === user?.id);
  const isFull = session.participants?.length >= session.maxParticipants;
  const isUserOrganizer = session.organizer._id === user?.id;
  const sessionStatus = session.status;

  // Business logic for button visibility
  const canShowJoin = (showJoinButton ?? true) && !isUserOrganizer && !isUserJoined && !isFull;
  const canShowJoined = isUserJoined;
  const canShowLeave = isUserJoined;
  const canShowComplete = showCompleteButton && (isUserOrganizer || sessionStatus === 'ongoing') && sessionStatus !== 'completed';

  return (
    <div className="session-card">
      <div className="card-inner">
        <div className="subject-top">
          <div className="subject-abbrev">{getInitials(session.subject)}</div>
          <div className="subject-full">{session.subject}</div>
        </div>

        <div className="card-content">
          {/* Status Badge */}
          <div className="session-status">
            <span className={`status-badge status-${session.status}`}>
              {session.status === 'completed' ? '✓ Completed' :
               session.status === 'ongoing' ? '🔴 Ongoing' :
               session.status === 'cancelled' ? '❌ Cancelled' :
               '📅 Scheduled'}
            </span>
            {session.status === 'completed' && session.completedAt && (
              <span className="completed-date">
                {new Date(session.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {session.description && <p className="session-description">{session.description}</p>}

          <div className="session-details">
            <div className="session-detail">
              <span className="detail-label">📅 Date:</span>
              <span className="detail-value">{formatDate(session.date)}</span>
            </div>

            <div className="session-detail">
              <span className="detail-label">⏰ Time:</span>
              <span className="detail-value time-value">{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
            </div>

            <div className="session-detail">
              <span className="detail-label">📍 Location:</span>
              <span className="detail-value">{session.location}</span>
            </div>

            <div className="session-detail">
              <span className="detail-label">👥 Participants:</span>
              <span className="detail-value">{session.participants?.length || 0} / {session.maxParticipants}</span>
            </div>

            <div className="session-detail">
              <span className="detail-label">👨‍🏫 Organizer:</span>
              <span className="detail-value">{session.organizer?.username}</span>
            </div>
          </div>

          {session.participants && session.participants.length > 0 && (
            <div className="participants-list">
              <h4>Participants:</h4>
              <div className="participants">
                {session.participants.map((participant, index) => (
                  <span key={participant.user._id} className="participant">
                    {participant.user.username}{index < session.participants.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Session Actions - State-driven button group */}
          <div className="session-actions">
            {canShowJoin && (
              <button className="btn join-btn" onClick={() => onJoin?.(session._id)} disabled={loading}>
                {loading ? 'Joining...' : 'Join'}
              </button>
            )}

            {canShowJoined && (
              <button className="btn joined-btn" disabled>
                Joined
              </button>
            )}

            {canShowLeave && (
              <button className="btn leave-btn" onClick={() => onLeave?.(session._id)} disabled={loading}>
                {loading ? 'Leaving...' : 'Leave'}
              </button>
            )}

            {canShowComplete && (
              <button className="btn complete-btn" onClick={() => onComplete?.(session)} disabled={loading}>
                {loading ? 'Completing...' : 'Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionCard;
