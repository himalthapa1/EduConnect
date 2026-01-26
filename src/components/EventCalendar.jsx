import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { sessionsAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import 'react-calendar/dist/Calendar.css';
import './EventCalendar.css';

const EventCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await sessionsAPI.getMySessions();
      const allSessions = [...response.data.data.organized, ...response.data.data.joined];
      
      // Transform sessions to events
      const sessionEvents = allSessions.map(session => ({
        id: session._id,
        title: session.title,
        date: new Date(session.date),
        startTime: session.startTime,
        endTime: session.endTime,
        type: 'session'
      }));

      setEvents(sessionEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
      if (dayEvents.length > 0) {
        return (
          <div className="calendar-event-indicator">
            <div className="event-dot"></div>
          </div>
        );
      }
    }
    return null;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const handleCreateEvent = () => {
    setShowEventModal(true);
  };

  if (loading) {
    return (
      <div className="event-calendar-container">
        <div className="calendar-header">
          <h3><Icons.calendar size={18} /> Calendar</h3>
        </div>
        <div className="loading-content">
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-calendar-container">
      <div className="calendar-header">
        <h3><Icons.calendar size={18} /> Calendar</h3>
        <button onClick={handleCreateEvent} className="create-event-btn">
          <Icons.add size={16} />
        </button>
      </div>
      
      <div className="calendar-wrapper">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileContent={tileContent}
          className="custom-calendar"
        />
      </div>

      {selectedDateEvents.length > 0 && (
        <div className="selected-date-events">
          <h4>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </h4>
          <div className="events-list">
            {selectedDateEvents.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-time">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </div>
                <div className="event-title">{event.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDateEvents.length === 0 && (
        <div className="no-events">
          <p>No events on this date</p>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;