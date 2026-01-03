import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionsAPI, groupsAPI } from '../utils/api';
import './CreateSessionModal.css';

const CreateSessionModal = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: 10,
    group: '',
    isPublic: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const response = await groupsAPI.getMyGroups();
        setUserGroups(response.data.data.groups || []);
      } catch (error) {
        console.error('Error fetching user groups:', error);
      } finally {
        setGroupsLoading(false);
      }
    };

    if (token) {
      fetchUserGroups();
    }
  }, [token]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        newErrors.date = 'Date must be in the future';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01 ${formData.startTime}`);
      const end = new Date(`2000-01-01 ${formData.endTime}`);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.maxParticipants < 1 || formData.maxParticipants > 50) {
      newErrors.maxParticipants = 'Max participants must be between 1 and 50';
    }

    if (!formData.isPublic && !formData.group) {
      newErrors.group = 'Group selection is required for private sessions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await sessionsAPI.createSession(formData);

      if (response.status === 201) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      if (error.response?.data?.error?.details) {
        const fieldErrors = {};
        error.response.data.error.details.forEach(detail => {
          fieldErrors[detail.field] = detail.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.response?.data?.error?.message || 'Failed to create session. Please try again.' });
      }
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
      <div className="modal-content">
        <div className="modal-header">
          <h2>Schedule New Study Session</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="session-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Session Title *</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'error' : ''}
                placeholder="e.g., Calculus Study Group"
                disabled={loading}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className={errors.subject ? 'error' : ''}
                placeholder="e.g., Mathematics"
                disabled={loading}
              />
              {errors.subject && <span className="field-error">{errors.subject}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="group">Study Group {formData.isPublic ? '(Optional for public sessions)' : '*'}</label>
            <select
              id="group"
              value={formData.group}
              onChange={(e) => handleInputChange('group', e.target.value)}
              className={errors.group ? 'error' : ''}
              disabled={loading || groupsLoading}
            >
              <option value="">
                {groupsLoading ? 'Loading groups...' : formData.isPublic ? 'No group (public session)' : 'Select a group'}
              </option>
              {userGroups.map(group => (
                <option key={group._id} value={group._id}>
                  {group.name} ({group.subject})
                </option>
              ))}
            </select>
            {errors.group && <span className="field-error">{errors.group}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of what will be covered..."
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={errors.date ? 'error' : ''}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className={errors.startTime ? 'error' : ''}
                disabled={loading}
              />
              {errors.startTime && <span className="field-error">{errors.startTime}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time *</label>
              <input
                type="time"
                id="endTime"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className={errors.endTime ? 'error' : ''}
                disabled={loading}
              />
              {errors.endTime && <span className="field-error">{errors.endTime}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={errors.location ? 'error' : ''}
                placeholder="e.g., Library Room 201"
                disabled={loading}
              />
              {errors.location && <span className="field-error">{errors.location}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="maxParticipants">Max Participants *</label>
              <input
                type="number"
                id="maxParticipants"
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                className={errors.maxParticipants ? 'error' : ''}
                min="1"
                max="50"
                disabled={loading}
              />
              {errors.maxParticipants && <span className="field-error">{errors.maxParticipants}</span>}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                disabled={loading}
              />
              <span className="checkmark"></span>
              Make this session public (visible to all users)
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading || groupsLoading || (!formData.isPublic && !formData.group)}>
              {loading ? 'Creating...' : groupsLoading ? 'Loading groups...' : (!formData.isPublic && !formData.group) ? 'Select a group' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
