import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../utils/api';
import ResourcesList from '../components/ResourcesList';
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
   Main Groups Component
========================= */
const Groups = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('browse');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [expandedBrowseGroupId, setExpandedBrowseGroupId] = useState(null);
  const [expandedMyGroupId, setExpandedMyGroupId] = useState(null);

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

    if (activeTab === 'browse') fetchGroups();
    if (activeTab === 'my-groups' && user) fetchMyGroups();
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
    </div>
  );
};

export default Groups;