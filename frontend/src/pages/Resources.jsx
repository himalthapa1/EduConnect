import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../utils/api';
import ResourcesList from '../components/ResourcesList';
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
      <h1>Resources</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="resources-layout">
        <aside className="resources-sidebar">
          <h4>Your Groups</h4>
          {!user ? (
            <div className="empty">Please log in to view your groups.</div>
          ) : loading ? (
            <div>Loading groups...</div>
          ) : myGroups.length === 0 ? (
            <div className="empty">You are not a member of any group yet.</div>
          ) : (
            <ul>
              {myGroups.map(g => (
                <li key={g._id}>
                  <button className={selectedGroup?._id === g._id ? 'active' : ''} onClick={() => setSelectedGroup(g)}>
                    {g.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="resources-main">
          {selectedGroup ? (
            <div>
              <h3>{selectedGroup.name} — Resources</h3>
              <ResourcesList key={selectedGroup._id} group={selectedGroup} />
            </div>
          ) : (
            <div className="empty">{!user ? 'Please log in to view resources' : 'Select a group to view its resources'}</div>
          )}
        </main>
      </div>
    </div>
  );
}
