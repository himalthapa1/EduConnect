import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, API_BASE_URL } from '../utils/api';
import ResourceForm from './ResourceForm';
import '../pages/Resources.css';

const ResourcesList = ({ group }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState({ shared: [], private: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-uploads'); // 'my-uploads' or 'shared'

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    
    // Check if user is authenticated
    if (!user) {
      setError('Please log in to view resources');
      setLoading(false);
      return;
    }
    
    try {
      console.log('fetchResources - token in localStorage:', localStorage.getItem('token') ? 'present' : 'missing');
      const res = await groupsAPI.getResources(group._id);
      setResources(res.data.data);
    } catch (err) {
      console.error('fetchResources error:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to fetch resources');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [group._id]);

  const canManage = (resource) => {
    if (!user) return false;
    if (!resource) return false;
    // allow if user added the resource or user is group organizer
    const addedById = resource.addedBy?._id || resource.addedBy?.id;
    const organizerId = group?.organizer?._id || group?.organizer?.id;
    return user.id === addedById || user.id === organizerId;
  };

  const handleAdd = async (data) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.url) formData.append('url', data.url);
      if (data.description) formData.append('description', data.description);
      formData.append('resourceType', data.type);
      formData.append('isShared', 'false'); // Always upload as private (send as string)
      if (data.file) formData.append('file', data.file);

      await groupsAPI.addResource(group._id, formData);
      await fetchResources();
      setOpenForm(false);
      setSuccessMessage('File uploaded successfully to "My Upload"!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error?.message || 'Failed to add resource';
      setError(msg);
    }
  };

  const handleShare = async (resourceId) => {
    if (!confirm('Share this file with all group members? Once shared, all members will be able to see and download this file.')) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await groupsAPI.updateResource(group._id, resourceId, { isShared: true });
      await fetchResources();
      setSuccessMessage('File shared successfully with the group!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to share resource');
    }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Delete this resource?')) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await groupsAPI.deleteResource(group._id, resourceId);
      await fetchResources();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete resource');
    }
  };

  const getMyUploads = () => {
    // Return only the user's private uploads (not yet shared)
    return resources.private || [];
  };

  const getSharedWithGroup = () => {
    // Return all shared resources in the group
    return resources.shared || [];
  };

  const renderResourceList = (resourceList, isMyUploads = false) => (
    <ul className="resources-list">
      {resourceList.map(r => (
        <li key={r._id} className="resource-item">
          <div className="resource-main">
            <strong>{r.title}</strong> <em>({r.resourceType})</em>
            {r.url && <div><a href={r.url} target="_blank" rel="noreferrer">Open link</a></div>}
            {r.file && <div><a href={`${API_BASE_URL}/${r.file}`} target="_blank" rel="noreferrer">Download file</a></div>}
            {r.description && <div className="resource-desc">{r.description}</div>}
            <div className="resource-meta">
              {isMyUploads ? (
                <>Uploaded by you · {new Date(r.createdAt).toLocaleString()}</>
              ) : (
                <>Shared by {r.addedBy?.username} · {new Date(r.createdAt).toLocaleString()}</>
              )}
            </div>
          </div>
          {canManage(r) && (
            <div className="resource-actions">
              {isMyUploads && !r.isShared && (
                <button 
                  onClick={() => handleShare(r._id)}
                  className="share-btn"
                  title="Share this file with the group"
                >
                  Share with Group
                </button>
              )}
              <button 
                onClick={() => handleDelete(r._id)}
                className="delete-btn"
                title="Delete this file"
              >
                Delete
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="resources-section">
      <div className="resources-header">
        <h4>Resources & Files</h4>
        <button onClick={() => setOpenForm(o => !o)}>
          {openForm ? 'Close' : 'Add Resource'}
        </button>
      </div>

      {openForm && <ResourceForm onSubmit={handleAdd} />}

      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="resources-tabs">
        <button 
          className={`tab-button ${activeTab === 'my-uploads' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-uploads')}
        >
          My Upload ({getMyUploads().length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => setActiveTab('shared')}
        >
          Shared with Group ({getSharedWithGroup().length})
        </button>
      </div>

      <div className="resources-content">
        {loading ? (
          <div>Loading resources...</div>
        ) : activeTab === 'my-uploads' ? (
          getMyUploads().length > 0 ? 
            renderResourceList(getMyUploads(), true) : 
            <div className="empty-state">
              <p>You haven't uploaded any files yet.</p>
              <p>Upload files here first, then share them with the group when ready.</p>
            </div>
        ) : (
          getSharedWithGroup().length > 0 ? 
            renderResourceList(getSharedWithGroup(), false) : 
            <div className="empty-state">
              <p>No files shared with the group yet.</p>
              <p>Group members can share their uploaded files here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesList;
