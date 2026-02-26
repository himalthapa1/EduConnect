import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { sessionsAPI } from '../utils/api';
import { Icons } from '../ui/icons';
import EventModal from './EventModal';
import 'react-calendar/dist/Calendar.css';
import './EventTracker.css';

const EventTracker = () => {
  const [currentView, setCurrentView] = useState('M'); // D, W, M
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await sessionsAPI.getMySessions();
      const allSessions = [...response.data.data.organized, ...response.data.data.joined];
      
      // Transform sessions to events and load custom events
      const sessionEvents = allSessions.map(session => ({
        id: session._id,
        title: session.title,
        date: new Date(session.date),
        startTime: session.startTime,
        endTime: session.endTime,
        type: 'session',
        status: 'confirmed',
        location: session.location || 'Online',
        participants: session.participants || [],
        notes: session.description || '',
        source: 'session'
      }));

      // Load custom events from localStorage
      const customEvents = JSON.parse(localStorage.getItem('customEvents') || '[]').map(event => ({
        ...event,
        date: new Date(event.date)
      }));

      setEvents([...sessionEvents, ...customEvents]);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomEvent = (eventData) => {
    const customEvents = JSON.parse(localStorage.getItem('customEvents') || '[]');
    
    if (editingEvent && editingEvent.source !== 'session') {
      // Update existing custom event
      const updatedEvents = customEvents.map(event => 
        event.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : event
      );
      localStorage.setItem('customEvents', JSON.stringify(updatedEvents));
    } else {
      // Add new custom event
      const newEvent = { ...eventData, id: Date.now().toString(), source: 'custom' };
      customEvents.push(newEvent);
      localStorage.setItem('customEvents', JSON.stringify(customEvents));
    }
    
    loadEvents();
  };

  const deleteEvent = (eventId) => {
    const customEvents = JSON.parse(localStorage.getItem('customEvents') || '[]');
    const updatedEvents = customEvents.filter(event => event.id !== eventId);
    localStorage.setItem('customEvents', JSON.stringify(updatedEvents));
    loadEvents();
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    if (event.source === 'session') {
      // Can't edit session events, show info only
      return;
    }
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForWeek = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
  };

  const getEventsForMonth = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'upcoming': return '#3b82f6';
      case 'completed': return '#6b7280';
      case 'canceled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'meeting': return <Icons.users size={14} />;
      case 'appointment': return <Icons.calendar size={14} />;
      case 'deadline': return <Icons.clock size={14} />;
      case 'reminder': return <Icons.checkCircle size={14} />;
      case 'personal': return <Icons.user size={14} />;
      case 'work': return <Icons.book size={14} />;
      case 'session': return <Icons.book size={14} />;
      default: return <Icons.calendar size={14} />;
    }
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

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length > 1) {
        return (
          <div className="event-count-badge">
            <span>{dayEvents.length}</span>
          </div>
        );
      }
    }
    return null;
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate);
    console.log('Day View - Selected Date:', selectedDate);
    console.log('Day View - Events:', dayEvents);
    
    return (
      <div className="day-view">
        <div className="day-header">
          <h3>{selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}</h3>
          <p>{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled</p>
        </div>
        
        <div className="events-timeline">
          {dayEvents.length > 0 ? (
            dayEvents
              .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))
              .map(event => (
                <div 
                  key={event.id} 
                  className="event-card"
                  onClick={() => handleEditEvent(event)}
                >
                  <div className="event-time">
                    {event.startTime && formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </div>
                  <div className="event-details">
                    <div className="event-header">
                      <div className="event-type">
                        {getTypeIcon(event.type)}
                        <span>{event.type}</span>
                      </div>
                      <div 
                        className="event-status"
                        style={{ color: getStatusColor(event.status) }}
                      >
                        {event.status}
                      </div>
                    </div>
                    <h4>{event.title}</h4>
                    {event.location && <p className="event-location"><Icons.home size={14} /> {event.location}</p>}
                    {event.participants && event.participants.length > 0 && (
                      <p className="event-participants"><Icons.users size={14} /> {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}</p>
                    )}
                    {event.notes && <p className="event-notes">{event.notes}</p>}
                  </div>
                </div>
              ))
          ) : (
            <div className="empty-day">
              <Icons.calendar size={32} />
              <p>No events scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekEvents = getEventsForWeek(selectedDate);
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="week-view">
        <div className="week-header">
          <h3>Week of {startOfWeek.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}</h3>
          <p>{weekEvents.length} event{weekEvents.length !== 1 ? 's' : ''} this week</p>
        </div>
        
        <div className="week-grid">
          {weekDays.map(day => {
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div key={day.toISOString()} className={`week-day ${isToday ? 'today' : ''}`}>
                <div className="day-label">
                  <span className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="day-number">{day.getDate()}</span>
                </div>
                <div className="day-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id} 
                      className="week-event"
                      onClick={() => handleEditEvent(event)}
                    >
                      <div className="event-time-small">
                        {event.startTime && formatTime(event.startTime)}
                      </div>
                      <div className="event-title-small">{event.title}</div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="more-events">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="month-view">
        <div className="month-header">
          <h3>{selectedDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric'
          })}</h3>
        </div>
        
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={tileClassName}
          tileContent={tileContent}
          className="event-calendar"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="event-tracker">
        <div className="tracker-header">
          <div className="view-controls">
            <button className="view-btn active">M</button>
            <button className="add-btn">+</button>
          </div>
        </div>
        <div className="loading-content">
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-tracker">
      <div className="tracker-header">
        <div className="view-controls">
          <button 
            className={`view-btn ${currentView === 'D' ? 'active' : ''}`}
            onClick={() => setCurrentView('D')}
          >
            D
          </button>
          <button 
            className={`view-btn ${currentView === 'W' ? 'active' : ''}`}
            onClick={() => setCurrentView('W')}
          >
            W
          </button>
          <button 
            className={`view-btn ${currentView === 'M' ? 'active' : ''}`}
            onClick={() => setCurrentView('M')}
          >
            M
          </button>
          <button 
            className="add-btn"
            onClick={handleAddEvent}
          >
            +
          </button>
        </div>
      </div>

      <div className="tracker-content">
        {console.log('Current View:', currentView)}
        {currentView === 'D' && renderDayView()}
        {currentView === 'W' && renderWeekView()}
        {currentView === 'M' && renderMonthView()}
      </div>

      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSave={saveCustomEvent}
        onDelete={deleteEvent}
        event={editingEvent}
        defaultDate={selectedDate}
      />
    </div>
  );
};

export default EventTracker;