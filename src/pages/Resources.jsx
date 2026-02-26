import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../utils/api';
import ResourcesList from '../components/ResourcesList';
import { Icons } from '../ui/icons';
import './Resources.css';

export default function Resources() {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!user) {
        setMyGroups([]);
        setSelectedGroup(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await groupsAPI.getMyGroups();
        const maybeGroups =
          (res && res.data && res.data.data && res.data.data.groups) ??
          (res && res.data && res.data.groups) ??
          (res && res.data && res.data.data) ??
          (res && res.data) ??
          [];
        const groupsList = Array.isArray(maybeGroups) ? maybeGroups : [];
        if (!Array.isArray(maybeGroups)) {
          console.warn('Unexpected groups response shape:', res?.data);
        }
        setMyGroups(groupsList);
        setSelectedGroup(prev => {
          if (prev && groupsList.find(g => g._id === prev._id)) return prev;
          return groupsList.length > 0 ? groupsList[0] : null;
        });
      } catch (err) {
        console.error('Failed to fetch your groups', err);
        setError('Failed to fetch your groups');
        setMyGroups([]);
        setSelectedGroup(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMyGroups();
  }, [user]);

  return (
    <div className="resources-page">
      <div className="resources-page-header">
        <div className="header-content">
          <Icons.book size={28} />
          <h1>Resources</h1>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="resources-layout">
        <aside className="resources-sidebar">
          <div className="sidebar-header">
            <Icons.users size={18} />
            <h4>Your Groups</h4>
          </div>
          {!user ? (
            <div className="empty">
              <Icons.lock size={20} />
              <p>Please log in to view your groups.</p>
            </div>
          ) : loading ? (
            <div className="loading-state">
              <Icons.clock size={20} />
              <p>Loading groups...</p>
            </div>
          ) : myGroups.length === 0 ? (
            <div className="empty">
              <Icons.users size={20} />
              <p>You are not a member of any group yet.</p>
            </div>
          ) : (
            <ul>
              {myGroups.map(g => (
                <li key={g._id}>
                  <button 
                    className={selectedGroup?._id === g._id ? 'active' : ''} 
                    onClick={() => setSelectedGroup(g)}
                  >
                    <Icons.users size={16} />
                    <span>{g.name}</span>
                    {selectedGroup?._id === g._id && <Icons.chevronRight size={16} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="resources-main">
          {selectedGroup ? (
            <div>
              <div className="selected-group-header">
                <Icons.users size={20} />
                <h3>{selectedGroup.name} — Resources</h3>
              </div>
              <ResourcesList key={selectedGroup._id} group={selectedGroup} />
            </div>
          ) : (
            <div className="empty-main">
              <Icons.file size={48} />
              <h3>{!user ? 'Please log in to view resources' : 'Select a group to view its resources'}</h3>
              <p>{!user ? 'Access your study materials and shared files' : 'Choose a group from the sidebar to see its resources'}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
