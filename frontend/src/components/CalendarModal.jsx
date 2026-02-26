import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Icons } from '../ui/icons';
import 'react-calendar/dist/Calendar.css';
import './CalendarModal.css';

const CalendarModal = ({ isOpen, onClose, onSaveEvent, existingEvents = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: new Date(),
    startTime: '',
    endTime: '',
    description: ''
  });
  const [events, setEvents] = useState(existingEvents);

  useEffect(() => {
    setEvents(existingEvents);
  }, [existingEvents]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEventForm({
      title: '',
      date: date,
      startTime: '',
      endTime: '',
      description: ''
    });
    setShowEventForm(true);
  };

  const handleEventFormSubmit = (e) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;

    const newEvent = {
      id: Date.now().toString(),
      title: eventForm.title,
      date: eventForm.date,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      description: eventForm.description,
      type: 'custom'
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    onSaveEvent(newEvent);
    setShowEventForm(false);
    setEventForm({
      title: '',
      date: new Date(),
      startTime: '',
      endTime: '',
      description: ''
    });
  };

  const handleCancel = () => {
    setShowEventForm(false);
    setEventForm({
      title: '',
      date: new Date(),
      startTime: '',
      endTime: '',
      description: ''
    });
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 1) {
        return (
          <div className="modal-event-count-badge">
            <span className="event-count">{dayEvents.length}</span>
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 0) {
        return 'has-events';
      }
    }
    return null;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  if (!isOpen) return null;

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-modal-header">
          <h2><Icons.calendar size={20} /> Event Calendar</h2>
          <button onClick={onClose} className="modal-close-btn">
            <Icons.close size={20} />
          </button>
        </div>

        <div className="calendar-modal-body">
          <div className="calendar-section">
            <Calendar
              onChange={setSelectedDate}
              onClickDay={handleDateClick}
              value={selectedDate}
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="modal-calendar"
            />
          </div>

          <div className="events-section">
            <div className="selected-date-info">
              <h3>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <button 
                onClick={() => handleDateClick(selectedDate)} 
                className="add-event-btn"
              >
                <Icons.add size={16} />
                Add Event
              </button>
            </div>

            {selectedDateEvents.length > 0 && (
              <div className="date-events-list">
                {selectedDateEvents.map(event => (
                  <div key={event.id} className="modal-event-item">
                    <div className="event-info">
                      <h4>{event.title}</h4>
                      {event.startTime && (
                        <p className="event-time">
                          {formatTime(event.startTime)}
                          {event.endTime && ` - ${formatTime(event.endTime)}`}
                        </p>
                      )}
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                    </div>
                    <div className={`event-type-badge ${event.type}`}>
                      {event.type === 'session' ? 'Session' : 'Event'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedDateEvents.length === 0 && !showEventForm && (
              <div className="no-events-message">
                <Icons.calendar size={32} />
                <p>No events on this date</p>
                <button 
                  onClick={() => handleDateClick(selectedDate)} 
                  className="create-first-event-btn"
                >
                  Create your first event
                </button>
              </div>
            )}
          </div>
        </div>

        {showEventForm && (
          <div className="event-form-section">
            <h3>Add New Event</h3>
            <form onSubmit={handleEventFormSubmit} className="event-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    placeholder="Enter event title"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    placeholder="Optional description"
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <Icons.checkCircle size={16} />
                  Save Event
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarModal;