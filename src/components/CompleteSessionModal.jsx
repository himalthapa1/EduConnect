import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionsAPI } from '../utils/api';
import './CompleteSessionModal.css';

const CompleteSessionModal = ({ session, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    notes: '',
    resources: []
  });
  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    description: '',
    type: 'resource'
  });

  const handleNotesChange = (e) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleNewResourceChange = (field, value) => {
    setNewResource(prev => ({ ...prev, [field]: value }));
  };

  const addResource = () => {
    if (!newResource.title.trim()) return;

    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { ...newResource }]
    }));

    setNewResource({
      title: '',
      url: '',
      description: '',
      type: 'resource'
    });
  };

  const removeResource = (index) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Complete the session
      await sessionsAPI.completeSession(session._id, { notes: formData.notes });

      // Add resources if any
      for (const resource of formData.resources) {
        await sessionsAPI.addSessionResource(session._id, resource);
      }

      onSuccess();
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content complete-session-modal">
        <div className="modal-header">
          <h2>Complete Session</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="modal-section">
              <h3>Session Summary</h3>
              <div className="form-group">
                <label htmlFor="notes">What was covered in this session?</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={handleNotesChange}
                  placeholder="e.g., Covered chapters 3-5 of the textbook, discussed key concepts, solved practice problems..."
                  required
                />
              </div>
            </div>

            <div className="modal-section">
              <h3>Session Resources (Optional)</h3>
              <p className="section-description">
                Add any resources, links, or materials from this session
              </p>

              {/* Existing resources */}
              {formData.resources.length > 0 && (
                <div className="resources-list">
                  <h4>Resources to Add:</h4>
                  {formData.resources.map((resource, index) => (
                    <div key={index} className="resource-item">
                      <div className="resource-info">
                        <strong>{resource.title}</strong>
                        {resource.url && <span> - {resource.url}</span>}
                        {resource.description && <p>{resource.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="remove-resource-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new resource */}
              <div className="add-resource-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={newResource.title}
                      onChange={(e) => handleNewResourceChange('title', e.target.value)}
                      placeholder="Resource title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={newResource.type}
                      onChange={(e) => handleNewResourceChange('type', e.target.value)}
                    >
                      <option value="resource">Resource</option>
                      <option value="note">Note</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>URL (Optional)</label>
                  <input
                    type="url"
                    value={newResource.url}
                    onChange={(e) => handleNewResourceChange('url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={newResource.description}
                    onChange={(e) => handleNewResourceChange('description', e.target.value)}
                    placeholder="Brief description..."
                  />
                </div>

                <button
                  type="button"
                  onClick={addResource}
                  className="add-resource-btn"
                  disabled={!newResource.title.trim()}
                >
                  + Add Resource
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button type="button" className="complete-btn" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Completing...' : 'Complete Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteSessionModal;
