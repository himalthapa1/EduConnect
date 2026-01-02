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
      
      {/* Only renders if THIS group is open */}
      {isOpen && (
        <div style={{ marginTop: '12px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
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

  // THIS IS THE KEY: Only ONE group can be expanded at a time
  const [expandedGroupId, setExpandedGroupId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: 'Other',
    maxMembers: 50,
    isPublic: true,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Computer Science', 'English', 'History', 'Other',
  ];

  useEffect(() => {
    setError(null);
    setSuccess(null);
    setExpandedGroupId(null); // Close any open resources when switching tabs

    if (activeTab === 'browse') fetchGroups();
    if (activeTab === 'my-groups' && user) fetchMyGroups();
  }, [activeTab, user]);

  // API Calls
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedSubject) params.subject = selectedSubject;
      const res = await groupsAPI.listGroups(params);
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
      setExpandedGroupId(null); // Force close if open
      fetchMyGroups();
      fetchGroups();
    } catch {
      setError('Failed to leave');
    }
  };

  // THIS IS THE CRITICAL FIX
  const toggleResources = (groupId) => {
    setExpandedGroupId(prevId => 
      prevId === groupId ? null : groupId  // Click same → close, different → open new
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await groupsAPI.createGroup(formData);
      setSuccess('Group created!');
      setFormData({ name: '', description: '', subject: 'Other', maxMembers: 50, isPublic: true });
      setActiveTab('my-groups');
    } catch {
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
            const isOpen = expandedGroupId === group._id;

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
                  <span style={{color: 'green', fontWeight: 'bold'}}>✓ You're a member</span>
                )}

                {/* Only this group's resources will show when clicked */}
                <ResourcesToggle 
                  group={group} 
                  isOpen={isOpen} 
                  onToggle={() => toggleResources(group._id)} 
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
            const isOpen = expandedGroupId === group._id;

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
                  onToggle={() => toggleResources(group._id)} 
                />
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateGroup} className="create-group-form">
          <input name="name" placeholder="Group Name" value={formData.name} onChange={handleInputChange} required />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} required />
          <select name="subject" value={formData.subject} onChange={handleInputChange}>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Groups;