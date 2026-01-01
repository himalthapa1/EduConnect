import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../utils/api';
import ResourcesList from '../components/ResourcesList';
import './Groups.css';

/* =========================
   Resources Toggle
========================= */
const ResourcesToggle = ({ group }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="resources-toggle">
      <button
        className="resources-button"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Hide Resources' : 'Resources'}
      </button>
      {open && <ResourcesList group={group} />}
    </div>
  );
};

/* =========================
   Groups Page
========================= */
const Groups = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('browse');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /* =========================
     Create Group Form
  ========================= */
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: 'Other',
    maxMembers: 50,
    isPublic: true,
  });

  /* =========================
     Filters
  ========================= */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

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

  /* =========================
     Effects
  ========================= */
  useEffect(() => {
    setError(null);
    setSuccess(null);

    if (activeTab === 'browse') {
      fetchGroups();
    }

    if (activeTab === 'my-groups') {
      if (!user) {
        setError('Please log in to view your groups.');
        setMyGroups([]);
      } else {
        fetchMyGroups();
      }
    }
  }, [activeTab, searchQuery, selectedSubject, user]);

  /* =========================
     API Calls
  ========================= */
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedSubject) params.subject = selectedSubject;

      const res = await groupsAPI.listGroups(params);
      const data = res.data?.data?.groups || res.data || [];
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await groupsAPI.getMyGroups();
      const data = res.data?.data?.groups || res.data || [];
      setMyGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Please log in to view your groups.');
      } else {
        setError('Failed to fetch your groups.');
      }
      setMyGroups([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Handlers
  ========================= */
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await groupsAPI.createGroup(formData);
      setSuccess('Study group created successfully!');
      setFormData({
        name: '',
        description: '',
        subject: 'Other',
        maxMembers: 50,
        isPublic: true,
      });
      setActiveTab('my-groups');
    } catch {
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!user) {
      setError('Please log in to join a group.');
      return;
    }

    setLoading(true);
    try {
      await groupsAPI.joinGroup(groupId);
      setSuccess('Successfully joined the group!');
      fetchGroups();
      fetchMyGroups();
    } catch {
      setError('Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    setLoading(true);
    try {
      await groupsAPI.leaveGroup(groupId);
      setSuccess('Successfully left the group');
      fetchMyGroups();
    } catch {
      setError('Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* =========================
     Render
  ========================= */
  return (
    <div className="groups-container">
      <h1>Study Groups</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="groups-tabs">
        <button
          className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Groups
        </button>
        <button
          className={`tab-button ${activeTab === 'my-groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-groups')}
          disabled={!user}
        >
          My Groups
        </button>
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Group
        </button>
      </div>

      {/* =========================
         BROWSE GROUPS
      ========================= */}
      {activeTab === 'browse' && (
        <div className="tab-content">
          {loading ? (
            <p>Loading groups...</p>
          ) : groups.length === 0 ? (
            <p>No groups found.</p>
          ) : (
            <div className="groups-grid">
              {groups.map((group) => {
                const members = group.members || [];
                const isMember =
                  user && members.some((m) => m?._id === user?.id);

                return (
                  <div key={group._id} className="group-card">
                    <h3>{group.name}</h3>
                    <p>{group.description}</p>
                    <p>
                      {members.length}/{group.maxMembers} members
                    </p>

                    {!isMember && (
                      <button
                        onClick={() => handleJoinGroup(group._id)}
                        disabled={loading}
                      >
                        Join Group
                      </button>
                    )}

                    {isMember && <span className="member-badge">✓ Member</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================
         MY GROUPS
      ========================= */}
      {activeTab === 'my-groups' && (
        <div className="tab-content">
          {loading ? (
            <p>Loading your groups...</p>
          ) : myGroups.length === 0 ? (
            <p>You haven’t joined any groups yet.</p>
          ) : (
            <div className="groups-grid">
              {myGroups.map((group) => (
                <div key={group._id} className="group-card">
                  <h3>{group.name}</h3>
                  <button onClick={() => handleLeaveGroup(group._id)}>
                    Leave Group
                  </button>
                  <ResourcesToggle group={group} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================
         CREATE GROUP
      ========================= */}
      {activeTab === 'create' && (
        <div className="tab-content">
          <form onSubmit={handleCreateGroup} className="create-group-form">
            <div className="form-group">
              <label>Group Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="create-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Groups;
