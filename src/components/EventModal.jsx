import { useState, useEffect } from 'react';
import { Icons } from '../ui/icons';
import './EventModal.css';

const EventModal = ({ isOpen, onClose, onSave, onDelete, event, defaultDate }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    type: 'meeting',
    status: 'upcoming',
    location: '',
    participants: '',
    notes: '',
    reminders: '15',
    priority: 'medium'
  });

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        setFormData({
          title: event.title || '',
          date: event.date ? new Date(event.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          startTime: event.startTime || '',
          endTime: event.endTime || '',
          type: event.type || 'meeting',
          status: event.status || 'upcoming',
          location: event.location || '',
          participants: Array.isArray(event.participants) ? event.participants.join(', ') : (event.participants || ''),
          notes: event.notes || '',
          reminders: event.reminders || '15',
          priority: event.priority || 'medium'
        });
      } else {
        // Adding new event
        setFormData({
          title: '',
          date: defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
          type: 'meeting',
          status: 'upcoming',
          location: '',
          participants: '',
          notes: '',
          reminders: '15',
          priority: 'medium'
        });
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, event, defaultDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const eventData = {
      ...formData,
      date: new Date(formData.date),
      participants: formData.participants.split(',').map(p => p.trim()).filter(p => p)
    };

    onSave(eventData);
    onClose();
  };

  const handleDelete = () => {
    if (event && event.id && window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
      onClose();
    }
  };

  const eventTypes = [
    { value: 'meeting', label: 'Meeting', icon: <Icons.users size={16} /> },
    { value: 'appointment', label: 'Appointment', icon: <Icons.calendar size={16} /> },
    { value: 'deadline', label: 'Deadline', icon: <Icons.clock size={16} /> },
    { value: 'reminder', label: 'Reminder', icon: <Icons.checkCircle size={16} /> },
    { value: 'personal', label: 'Personal', icon: <Icons.user size={16} /> },
    { value: 'work', label: 'Work', icon: <Icons.book size={16} /> },
    { value: 'session', label: 'Study Session', icon: <Icons.book size={16} /> }
  ];

  const statusOptions = [
    { value: 'upcoming', label: 'Upcoming', color: '#3b82f6' },
    { value: 'confirmed', label: 'Confirmed', color: '#10b981' },
    { value: 'completed', label: 'Completed', color: '#6b7280' },
    { value: 'canceled', label: 'Canceled', color: '#ef4444' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', color: '#10b981' },
    { value: 'medium', label: 'Medium Priority', color: '#f59e0b' },
    { value: 'high', label: 'High Priority', color: '#ef4444' }
  ];

  if (!isOpen) return null;

  const isSessionEvent = event && event.source === 'session';

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2>
            <Icons.calendar size={20} />
            {event ? (isSessionEvent ? 'View Event' : 'Edit Event') : 'Add New Event'}
          </h2>
          <button onClick={onClose} className="modal-close-btn">
            <Icons.close size={20} />
          </button>
        </div>

        {isSessionEvent && (
          <div className="session-notice">
            <Icons.book size={16} />
            <span>This is a study session event and cannot be edited here.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-section">
            <h3>Event Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter event title"
                  required
                  disabled={isSessionEvent}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Validate year is 4 digits
                    if (value) {
                      const year = value.split('-')[0];
                      if (year && year.length === 4) {
                        setFormData({...formData, date: value});
                      }
                    } else {
                      setFormData({...formData, date: value});
                    }
                  }}
                  required
                  disabled={isSessionEvent}
                  min="1900-01-01"
                  max="9999-12-31"
                  onKeyDown={(e) => {
                    const input = e.target;
                    const value = input.value;
                    if (value && value.split('-')[0]?.length >= 4 && e.key >= '0' && e.key <= '9' && input.selectionStart <= 4) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  disabled={isSessionEvent}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  disabled={isSessionEvent}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Event Type</label>
                <div className="select-wrapper">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    disabled={isSessionEvent}
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="select-icon">
                    {eventTypes.find(type => type.value === formData.type)?.icon}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  disabled={isSessionEvent}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  disabled={isSessionEvent}
                >
                  {priorityOptions.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Enter location or 'Online'"
                  disabled={isSessionEvent}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Participants/Contacts</label>
                <input
                  type="text"
                  value={formData.participants}
                  onChange={(e) => setFormData({...formData, participants: e.target.value})}
                  placeholder="Enter names separated by commas"
                  disabled={isSessionEvent}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Notes & Instructions</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Agenda, materials needed, instructions, etc."
                  rows="4"
                  disabled={isSessionEvent}
                />
              </div>
            </div>

            {!isSessionEvent && (
              <div className="form-row">
                <div className="form-group">
                  <label>Reminder (minutes before)</label>
                  <select
                    value={formData.reminders}
                    onChange={(e) => setFormData({...formData, reminders: e.target.value})}
                  >
                    <option value="0">No reminder</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="1440">1 day</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {!isSessionEvent && (
            <div className="form-actions">
              <div className="action-left">
                {event && (
                  <button type="button" onClick={handleDelete} className="delete-btn">
                    <Icons.delete size={16} />
                    Delete Event
                  </button>
                )}
              </div>
              <div className="action-right">
                <button type="button" onClick={onClose} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <Icons.checkCircle size={16} />
                  {event ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </div>
          )}

          {isSessionEvent && (
            <div className="form-actions">
              <div className="action-right">
                <button type="button" onClick={onClose} className="cancel-btn">
                  Close
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EventModal;