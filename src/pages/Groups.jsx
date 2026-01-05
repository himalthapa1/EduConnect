import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, sessionsAPI } from '../utils/api';
import ResourcesList from '../components/ResourcesList';
import CompleteSessionModal from '../components/CompleteSessionModal';
import ChatWindow from '../components/chat/ChatWindow';
import GroupRecommendations from '../components/GroupRecommendations';
import './Groups.css';

/* =========================
   Group Detail Modal (Replaces Toggles)
========================= */
const GroupDetailModal = ({ group, isOpen, onClose, sessions, onJoinSession, onLeaveSession, onCompleteSession, currentUserId }) => {
  if (!isOpen) return null;

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{group.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="group-description-full">{group.description}</p>

          <div className="group-stats">
            <span className="members-count">{group.members?.length || 0} / {group.maxMembers} members</span>
            <span className="subject-badge">{group.subject}</span>
          </div>

          {/* Resources Section */}
          <div className="modal-section">
            <h3>Resources</h3>
            <ResourcesList group={group} />
          </div>

          {/* Chat Section */}
          <div className="modal-section">
            <h3>Group Chat</h3>
            <ChatWindow type="group" groupId={group._id} />
          </div>

          {/* Sessions Section */}
          <div className="modal-section">
            <h3>Sessions ({sessions.length})</h3>
            {sessions.length === 0 ? (
              <p className="no-sessions">No sessions scheduled yet</p>
            ) : (
              <div className="sessions-list">
                {sessions.map(session => (
                  <div key={session._id} className="session-item">
                    <div className="session-info">
                      <h4>{session.title}</h4>
                      <div className="session-details">
                        📅 {formatDate(session.date)} • 🕐 {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        <br />
                        📍 {session.location} • 👥 {session.participants.length}/{session.maxParticipants} joined
                      </div>
                    </div>
                    <div className="session-actions">
                      {session.organizer._id === currentUserId && session.status === 'scheduled' && onCompleteSession && (
                        <button
                          onClick={() => onCompleteSession(session)}
                          className="btn-complete-session"
                        >
                          Complete Session
                        </button>
                      )}
                      {session.participants.some(p => p.user._id === currentUserId) ? (
                        <button
                          onClick={() => onLeaveSession(session._id)}
                          className="btn-leave-session"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => onJoinSession(session._id)}
                          className="btn-join-session"
                          disabled={session.participants.length >= session.maxParticipants}
                        >
                          {session.participants.length >= session.maxParticipants ? 'Full' : 'Join'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave Group */}
          <div className="modal-footer">
            <button
              className="btn-leave-group"
              onClick={() => {
                if (confirm('Leave this group?')) {
                  // This will be handled by parent component
                  onClose();
                }
              }}
            >
              Leave Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================
   Main Groups Component
========================= */
const Groups = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('browse');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: 'Other',
    maxMembers: 50,
    isPublic: true,
    tag: '#ff3b30', // UI-only (NOT sent to backend)
  });

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'History',
    'Other',
  ];

  useEffect(() => {
    setError(null);
    setSuccess(null);
    setSelectedGroup(null);
    setShowGroupModal(false);

    if (activeTab === 'browse') {
      fetchGroups();
      fetchSessions();
    }
    if (activeTab === 'my-groups' && user) {
      fetchMyGroups();
      fetchSessions();
    }
  }, [activeTab, user]);

  /* =========================
     API Calls
  ========================= */
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await groupsAPI.listGroups();
      setGroups(res.data?.data?.groups || res.data || []);
    } catch {
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await groupsAPI.getMyGroups();
      setMyGroups(res.data?.data?.groups || res.data || []);
    } catch {
      setError('Failed to load your groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await sessionsAPI.getSessions({ limit: 100 }); // Get more sessions for groups
      const sessionsData = res.data?.data?.sessions || [];
      console.log('Fetched sessions:', sessionsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      await sessionsAPI.joinSession(sessionId);
      setSuccess('Joined session successfully!');
      fetchSessions();
    } catch (error) {
      setError('Failed to join session');
    }
  };

  const handleLeaveSession = async (sessionId) => {
    try {
      await sessionsAPI.leaveSession(sessionId);
      setSuccess('Left session successfully!');
      fetchSessions();
    } catch (error) {
      setError('Failed to leave session');
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!user) return setError('Please log in');
    try {
      await groupsAPI.joinGroup(groupId);
      setSuccess('Joined successfully!');
      fetchGroups();
      fetchMyGroups();
    } catch {
      setError('Failed to join');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!confirm('Leave this group?')) return;
    try {
      await groupsAPI.leaveGroup(groupId);
      setSuccess('Left the group');
      setSelectedGroup(null);
      setShowGroupModal(false);
      fetchMyGroups();
      fetchGroups();
    } catch {
      setError('Failed to leave');
    }
  };

  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagSelect = (color) => {
    setFormData(prev => ({ ...prev, tag: color }));
  };

  const handleCompleteSession = (session) => {
    setSelectedSession(session);
    setShowCompleteModal(true);
  };

  const handleCompleteSuccess = () => {
    fetchSessions();
    setShowCompleteModal(false);
    setSelectedSession(null);
    setSuccess('Session completed successfully!');
  };

  /* =========================
     FIXED CREATE GROUP
  ========================= */
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      //  Include tag field in the payload
      const payload = {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        tag: formData.tag, // Added tag field
        maxMembers: formData.maxMembers,
        isPublic: formData.isPublic,
      };

      await groupsAPI.createGroup(payload);

      setSuccess('Group created!');
      setFormData({
        name: '',
        description: '',
        subject: 'Other',
        maxMembers: 50,
        isPublic: true,
        tag: '#ff3b30',
      });
      setActiveTab('my-groups');
    } catch (err) {
      console.error('Create group error:', err.response?.data || err);
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="groups-container">
      <h1>Study Groups</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="groups-tabs">
        <button className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
          Browse Groups
        </button>
        <button className={`tab-button ${activeTab === 'my-groups' ? 'active' : ''}`} onClick={() => setActiveTab('my-groups')} disabled={!user}>
          My Groups
        </button>
        <button className={`tab-button ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          Create Group
        </button>
      </div>

      {/* BROWSE TAB */}
      {activeTab === 'browse' && (
        <>
          <GroupRecommendations limit={6} compact={true} />
          <div className="groups-grid">
          {groups.map(group => {
            const isMember = user && group.members?.some(m => m._id === user.id);

            return (
              <div key={group._id} className="group-card">
                <div className="group-header">
                  <h3 className="group-name">{group.name}</h3>
                  <span className="members-badge">{group.members?.length || 0} / {group.maxMembers}</span>
                </div>

                <p className="group-description">
                  {group.description.length > 120 ? `${group.description.substring(0, 120)}...` : group.description}
                </p>

                <div className="group-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleViewGroup(group)}
                  >
                    View Group
                  </button>

                  {isMember ? (
                    <div className="secondary-actions">
                      <button
                        className="icon-btn"
                        title="Group Chat"
                        onClick={() => handleViewGroup(group)}
                      >
                        💬
                      </button>
                      <button
                        className="icon-btn"
                        title="Resources"
                        onClick={() => handleViewGroup(group)}
                      >
                        📁
                      </button>
                      <button
                        className="icon-btn"
                        title="Sessions"
                        onClick={() => handleViewGroup(group)}
                      >
                        📅
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => handleJoinGroup(group._id)}
                      disabled={loading}
                    >
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      {/* MY GROUPS TAB */}
      {activeTab === 'my-groups' && (
        <div className="groups-grid">
          {myGroups.map(group => {
            return (
              <div key={group._id} className="group-card">
                <div className="group-header">
                  <h3 className="group-name">{group.name}</h3>
                  <span className="members-badge">{group.members?.length || 0} / {group.maxMembers}</span>
                </div>

                <p className="group-description">
                  {group.description.length > 120 ? `${group.description.substring(0, 120)}...` : group.description}
                </p>

                <div className="group-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleViewGroup(group)}
                  >
                    View Group
                  </button>

                  <div className="secondary-actions">
                    <button
                      className="icon-btn"
                      title="Group Chat"
                      onClick={() => handleViewGroup(group)}
                    >
                      💬
                    </button>
                    <button
                      className="icon-btn"
                      title="Resources"
                      onClick={() => handleViewGroup(group)}
                    >
                      📁
                    </button>
                    <button
                      className="icon-btn"
                      title="Sessions"
                      onClick={() => handleViewGroup(group)}
                    >
                      📅
                    </button>
                    <button
                      className="icon-btn danger"
                      title="Leave Group"
                      onClick={() => handleLeaveGroup(group._id)}
                    >
                      🚪
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateGroup} className="create-group-form-fancy">
          <div className="form-group-fancy">
            <label>Group Name *</label>
            <input name="name" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div className="form-group-fancy">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={5} />
          </div>

          <div className="form-group-fancy">
            <label>Subject *</label>
            <input name="subject" value={formData.subject} onChange={handleInputChange} required />
          </div>

          <div className="form-group-fancy">
            <label>Group Tags</label>
            <div className="group-tags-fancy">
              {['#ff3b30','#34c759','#32ade6','#ffd60a','#ff9500'].map(color => (
                <span
                  key={color}
                  className="tag-circle"
                  style={{
                    background: color,
                    border: formData.tag === color ? '2px solid #222' : '2px solid #fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleTagSelect(color)}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="create-btn-fancy" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      {/* Group Detail Modal */}
      {showGroupModal && selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          isOpen={showGroupModal}
          onClose={() => {
            setShowGroupModal(false);
            setSelectedGroup(null);
          }}
          sessions={sessions.filter(session => session.group && session.group._id === selectedGroup._id)}
          onJoinSession={handleJoinSession}
          onLeaveSession={handleLeaveSession}
          onCompleteSession={handleCompleteSession}
          currentUserId={user?.id}
        />
      )}

      {showCompleteModal && selectedSession && (
        <CompleteSessionModal
          session={selectedSession}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedSession(null);
          }}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  );
};

export default Groups;
