import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, sessionsAPI } from '../utils/api';
import ResourcesList from '../components/ResourcesList';
import CompleteSessionModal from '../components/CompleteSessionModal';
import ChatWindow from '../components/chat/ChatWindow';
import GroupRecommendations from '../components/GroupRecommendations';
import { Icons } from '../ui/icons';
import { FiMessageCircle, FiCalendar, FiUsers, FiMoreHorizontal } from 'react-icons/fi';
import './Groups.css';

/* =========================
   Group Detail Modal (Replaces Toggles)
========================= */
const GroupDetailModal = ({ group, isOpen, onClose, onLeaveGroup, sessions, onJoinSession, onLeaveSession, onCompleteSession, currentUserId }) => {
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
                if (confirm('Are you sure you want to leave this group?')) {
                  onLeaveGroup(group._id);
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
    tags: {
      topics: [],
      level: '',
      styles: [],
      commitment: []
    }
  });
  const [tagOptions, setTagOptions] = useState(null);
  const [tagStep, setTagStep] = useState(1); // Progressive disclosure

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
    if (activeTab === 'create') {
      loadTagOptions();
    }
  }, [activeTab, user]);

  const loadTagOptions = async () => {
    try {
      const response = await groupsAPI.getTagOptions();
      setTagOptions(response.data.data.tagOptions);
    } catch (error) {
      console.error('Failed to load tag options:', error);
    }
  };

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
      const payload = {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        tags: formData.tags,
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
        tags: {
          topics: [],
          level: '',
          styles: [],
          commitment: []
        }
      });
      setTagStep(1);
      setActiveTab('my-groups');
    } catch (err) {
      console.error('Create group error:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [category]: value
      }
    }));
  };

  const nextStep = () => setTagStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setTagStep(prev => Math.max(prev - 1, 1));

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
                        aria-label="Group Chat"
                      >
                        <Icons.chat size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Resources"
                        onClick={() => handleViewGroup(group)}
                        aria-label="Resources"
                      >
                        <Icons.file size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        title="Sessions"
                        onClick={() => handleViewGroup(group)}
                        aria-label="Sessions"
                      >
                        <Icons.calendar size={16} />
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
              <div key={group._id} className="group-card-clean">
                {/* Card Header */}
                <div className="card-header-clean">
                  <h3 className="group-name-clean">{group.name}</h3>
                  <span className="members-clean">
                    <FiUsers /> {group.members?.length || 0} / {group.maxMembers}
                  </span>
                </div>

                {/* Description */}
                <p className="description-clean">
                  {group.description.length > 120 ? `${group.description.substring(0, 120)}...` : group.description}
                </p>

                {/* Primary Action */}
                <button
                  className="primary-btn-clean"
                  onClick={() => handleViewGroup(group)}
                >
                  Open Group →
                </button>

                {/* Footer Actions */}
                <div className="footer-clean">
                  <button onClick={() => handleViewGroup(group)}>
                    <FiMessageCircle />
                    Chat
                  </button>
                  <button onClick={() => handleViewGroup(group)}>
                    <FiCalendar />
                    Sessions
                  </button>
                  <button className="menu-clean">
                    <FiMoreHorizontal />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <div className="create-group-container">
          <h2>What best describes your group?</h2>

          {/* Progress Indicator */}
          <div className="tag-progress">
            <div className={`step ${tagStep >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${tagStep >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${tagStep >= 3 ? 'active' : ''}`}>3</div>
            <div className={`step ${tagStep >= 4 ? 'active' : ''}`}>4</div>
          </div>

          <form onSubmit={handleCreateGroup} className="create-group-form-semantic">
            {/* Step 1: Basic Info */}
            {tagStep === 1 && (
              <div className="tag-step">
                <h3>Basic Information</h3>
                <div className="form-group-semantic">
                  <label>Group Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., LeetCode Interview Prep"
                    required
                  />
                </div>
                <div className="form-group-semantic">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what your group will focus on..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Topics (Required) */}
            {tagStep === 2 && (
              <div className="tag-step">
                <h3>What topics will your group cover?</h3>
                <p className="step-description">Select 1-3 topics (required)</p>
                <div className="tag-options">
                  {tagOptions?.topics?.map(topic => (
                    <label key={topic} className="tag-option">
                      <input
                        type="checkbox"
                        checked={formData.tags.topics.includes(topic)}
                        onChange={(e) => {
                          const newTopics = e.target.checked
                            ? [...formData.tags.topics, topic]
                            : formData.tags.topics.filter(t => t !== topic);
                          handleTagChange('topics', newTopics.slice(0, 3)); // Max 3
                        }}
                      />
                      <span className="tag-label">{topic}</span>
                    </label>
                  ))}
                </div>
                <div className="selection-count">
                  Selected: {formData.tags.topics.length}/3
                </div>
              </div>
            )}

            {/* Step 3: Skill Level (Required) */}
            {tagStep === 3 && (
              <div className="tag-step">
                <h3>What's the skill level?</h3>
                <p className="step-description">Choose one level (required)</p>
                <div className="tag-options-radio">
                  {tagOptions?.level?.map(level => (
                    <label key={level} className="tag-option-radio">
                      <input
                        type="radio"
                        name="level"
                        value={level}
                        checked={formData.tags.level === level}
                        onChange={(e) => handleTagChange('level', e.target.value)}
                      />
                      <span className="tag-label-radio">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Optional Tags */}
            {tagStep === 4 && (
              <div className="tag-step">
                <h3>Additional Details (Optional)</h3>
                <div className="optional-tags">
                  <div className="tag-section">
                    <h4>Study Style</h4>
                    <div className="tag-options-small">
                      {tagOptions?.styles?.map(style => (
                        <label key={style} className="tag-option-small">
                          <input
                            type="checkbox"
                            checked={formData.tags.styles.includes(style)}
                            onChange={(e) => {
                              const newStyles = e.target.checked
                                ? [...formData.tags.styles, style]
                                : formData.tags.styles.filter(s => s !== style);
                              handleTagChange('styles', newStyles);
                            }}
                          />
                          <span className="tag-label-small">{style.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="tag-section">
                    <h4>Commitment Level</h4>
                    <div className="tag-options-small">
                      {tagOptions?.commitment?.map(commitment => (
                        <label key={commitment} className="tag-option-small">
                          <input
                            type="checkbox"
                            checked={formData.tags.commitment.includes(commitment)}
                            onChange={(e) => {
                              const newCommitment = e.target.checked
                                ? [...formData.tags.commitment, commitment]
                                : formData.tags.commitment.filter(c => c !== commitment);
                              handleTagChange('commitment', newCommitment);
                            }}
                          />
                          <span className="tag-label-small">{commitment.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group-semantic">
                  <label>Max Members</label>
                  <input
                    type="number"
                    name="maxMembers"
                    value={formData.maxMembers}
                    onChange={handleInputChange}
                    min="2"
                    max="500"
                  />
                </div>

                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  <span>Make group public (visible to all users)</span>
                </label>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {tagStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-secondary">
                  Back
                </button>
              )}
              {tagStep < 4 && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                  disabled={tagStep === 1 && (!formData.name.trim() || !formData.description.trim())}
                >
                  Next
                </button>
              )}
              {tagStep === 4 && (
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              )}
            </div>
          </form>
        </div>
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
          onLeaveGroup={handleLeaveGroup}
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
