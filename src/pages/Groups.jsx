import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, sessionsAPI } from '../utils/api';
import ResourcesList from '../components/ResourcesList';
import CompleteSessionModal from '../components/CompleteSessionModal';
import './Groups.css';

/* =========================
   Resources Toggle (Accordion Style)
========================= */
const ResourcesToggle = ({ group, isOpen, onToggle }) => {
  return (
    <div className="resources-toggle" style={{ marginTop: '12px' }}>
      <button
        className="resources-button"
        onClick={onToggle}
        style={{
          padding: '8px 16px',
          background: isOpen ? '#2563eb' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        {isOpen ? '↑ Hide Resources' : '↓ Show Resources'}
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: '12px',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}
        >
          <ResourcesList group={group} />
        </div>
      )}
    </div>
  );
};

/* =========================
   Sessions Toggle (Accordion Style)
========================= */
const SessionsToggle = ({ group, sessions, isOpen, onToggle, onJoinSession, onLeaveSession, onCompleteSession, currentUserId }) => {
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
    <div className="sessions-toggle" style={{ marginTop: '12px' }}>
      <button
        className="sessions-button"
        onClick={onToggle}
        style={{
          padding: '8px 16px',
          background: isOpen ? '#059669' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        {isOpen ? `↑ Hide Sessions (${sessions.length})` : `↓ Show Sessions (${sessions.length})`}
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: '12px',
            padding: '16px',
            background: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}
        >
          {sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', margin: 0 }}>
              No sessions scheduled yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.map(session => (
                <div key={session._id} style={{
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{session.title}</h4>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      📅 {formatDate(session.date)} • 🕐 {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      <br />
                      📍 {session.location} • 👥 {session.participants.length}/{session.maxParticipants} joined
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {session.organizer._id === currentUserId && session.status === 'scheduled' && onCompleteSession && (
                      <button
                        onClick={() => onCompleteSession(session)}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginBottom: '4px'
                        }}
                      >
                        Complete Session
                      </button>
                    )}
                    {session.participants.some(p => p.user._id === currentUserId) ? (
                      <button
                        onClick={() => onLeaveSession(session._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => onJoinSession(session._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
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
      )}
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

  const [expandedBrowseGroupId, setExpandedBrowseGroupId] = useState(null);
  const [expandedMyGroupId, setExpandedMyGroupId] = useState(null);
  const [expandedBrowseSessionsId, setExpandedBrowseSessionsId] = useState(null);
  const [expandedMySessionsId, setExpandedMySessionsId] = useState(null);
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
    setExpandedBrowseGroupId(null);
    setExpandedMyGroupId(null);
    setExpandedBrowseSessionsId(null);
    setExpandedMySessionsId(null);

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
      setExpandedMyGroupId(null);
      fetchMyGroups();
      fetchGroups();
    } catch {
      setError('Failed to leave');
    }
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
     ✅ FIXED CREATE GROUP
  ========================= */
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ Include tag field in the payload
      const payload = {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        tag: formData.tag, // ✅ Added tag field
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
        <div className="groups-grid">
          {groups.map(group => {
            const isMember = user && group.members?.some(m => m._id === user.id);
            const isOpen = expandedBrowseGroupId === group._id;
            const groupSessions = sessions.filter(session => session.group && session.group._id === group._id);
            const sessionsOpen = expandedBrowseSessionsId === group._id;

            return (
              <div key={group._id} className="group-card">
                <h3>{group.name}</h3>
                <p>{group.description}</p>
                <p><strong>{group.members?.length || 0}/{group.maxMembers}</strong> members</p>

                {!isMember ? (
                  <button onClick={() => handleJoinGroup(group._id)} disabled={loading}>
                    Join Group
                  </button>
                ) : (
                  <span style={{ color: 'green', fontWeight: 'bold' }}>✓ You're a member</span>
                )}

                <ResourcesToggle
                  group={group}
                  isOpen={isOpen}
                  onToggle={() => setExpandedBrowseGroupId(isOpen ? null : group._id)}
                />

                {isMember && (
                  <SessionsToggle
                    group={group}
                    sessions={groupSessions}
                    isOpen={sessionsOpen}
                    onToggle={() => setExpandedBrowseSessionsId(sessionsOpen ? null : group._id)}
                    onJoinSession={handleJoinSession}
                    onLeaveSession={handleLeaveSession}
                    onCompleteSession={handleCompleteSession}
                    currentUserId={user?.id}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MY GROUPS TAB */}
      {activeTab === 'my-groups' && (
        <div className="groups-grid">
          {myGroups.map(group => {
            const isOpen = expandedMyGroupId === group._id;
            const groupSessions = sessions.filter(session => session.group && session.group._id === group._id);
            const sessionsOpen = expandedMySessionsId === group._id;

            return (
              <div key={group._id} className="group-card">
                <h3>{group.name}</h3>
                <p>{group.description}</p>
                <p><strong>{group.members?.length || 0}/{group.maxMembers}</strong> members</p>

                <button className="leave-button" onClick={() => handleLeaveGroup(group._id)}>
                  Leave Group
                </button>

                <ResourcesToggle
                  group={group}
                  isOpen={isOpen}
                  onToggle={() => setExpandedMyGroupId(isOpen ? null : group._id)}
                />

                <SessionsToggle
                  group={group}
                  sessions={groupSessions}
                  isOpen={sessionsOpen}
                  onToggle={() => setExpandedMySessionsId(sessionsOpen ? null : group._id)}
                  onJoinSession={handleJoinSession}
                  onLeaveSession={handleLeaveSession}
                  onCompleteSession={handleCompleteSession}
                  currentUserId={user?.id}
                />
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
