import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, studyWithMeAPI } from '../utils/api';
import './StudyWithMe.css';

const StudyWithMe = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('setup'); // setup, studying, completed
  const [formData, setFormData] = useState({
    timerMode: 'normal', // 'normal' or 'pomodoro'
    pomodoroType: '25/5', // '25/5' or '50/10' (only for pomodoro)
    duration: 25, // study minutes or 'custom'
    customDuration: '', // custom study input
    breakDuration: 5, // break minutes or 'custom'
    customBreakDuration: '', // custom break input
    subject: '',
    resources: []
  });
  const [sessionData, setSessionData] = useState({
    sessionId: null,
    startTime: null,
    notes: '',
    mode: 'idle', // 'studying' | 'break' | 'completed'
    studySecondsLeft: 0,
    breakSecondsLeft: 0,
    totalSecondsLeft: 0, // Total remaining study time
    breaksTaken: 0,
    // Pomodoro tracking
    currentCycle: 0,
    cyclePhase: 'work', // 'work' or 'break'
    pomodoroWorkMinutes: 0,
    pomodoroBreakMinutes: 0
  });
  const [userGroups, setUserGroups] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const studyIntervalRef = useRef(null);
  const breakIntervalRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadUserGroups();
  }, [user, navigate]);

  // Study Timer Effect
  useEffect(() => {
    if (sessionData.mode === 'studying') {
      studyIntervalRef.current = setInterval(() => {
        setSessionData(prev => {
          const newTime = prev.studySecondsLeft - 1;
          if (newTime <= 0) {
            // Check if pomodoro mode and time remaining
            const newTotal = Math.max(0, prev.totalSecondsLeft - (prev.pomodoroWorkMinutes * 60));
            if (prev.pomodoroWorkMinutes > 0 && newTotal > 0) {
              // Pomodoro: go to break
              return {
                ...prev,
                mode: 'break',
                studySecondsLeft: prev.pomodoroBreakMinutes * 60,
                totalSecondsLeft: newTotal,
                cyclePhase: 'break'
              };
            } else {
              // Study complete → move to completion
              handleSessionComplete();
              return { ...prev, mode: 'completed' };
            }
          }
          return { ...prev, studySecondsLeft: newTime };
        });
      }, 1000);
    } else {
      if (studyIntervalRef.current) {
        clearInterval(studyIntervalRef.current);
        studyIntervalRef.current = null;
      }
    }

    return () => {
      if (studyIntervalRef.current) {
        clearInterval(studyIntervalRef.current);
        studyIntervalRef.current = null;
      }
    };
  }, [sessionData.mode]);

  // Break Timer Effect
  useEffect(() => {
    if (sessionData.mode === 'break') {
      breakIntervalRef.current = setInterval(() => {
        setSessionData(prev => {
          const newTime = prev.breakSecondsLeft - 1;
          if (newTime <= 0) {
            // Break complete
            if (prev.pomodoroWorkMinutes > 0 && prev.totalSecondsLeft > 0) {
              // Pomodoro: go to next work cycle
              const nextWorkTime = Math.min(prev.pomodoroWorkMinutes * 60, prev.totalSecondsLeft);
              return {
                ...prev,
                mode: 'studying',
                breakSecondsLeft: 0,
                studySecondsLeft: nextWorkTime,
                breaksTaken: prev.breaksTaken + 1,
                currentCycle: prev.currentCycle + 1,
                cyclePhase: 'work'
              };
            } else {
              // Normal mode: resume study
              return {
                ...prev,
                mode: 'studying',
                breakSecondsLeft: 0,
                breaksTaken: prev.breaksTaken + 1
              };
            }
          }
          return { ...prev, breakSecondsLeft: newTime };
        });
      }, 1000);
    } else {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
    }

    return () => {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
        breakIntervalRef.current = null;
      }
    };
  }, [sessionData.mode]);

  const loadUserGroups = async () => {
    try {
      const response = await groupsAPI.getMyGroups();
      const groups = response.data.data.groups || [];
      setUserGroups(groups);

      // Load resources from all groups
      const allResources = [];
      for (const group of groups) {
        try {
          const resResponse = await groupsAPI.getResources(group._id);
          const resources = resResponse.data.data || [];
          allResources.push(...resources.map(r => ({ ...r, groupName: group.name })));
        } catch (err) {
          console.error(`Failed to load resources for group ${group._id}`, err);
        }
      }
      setAvailableResources(allResources);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleStartSession = async () => {
    if (!formData.subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    // Calculate durations in minutes (ensure numbers)
    const studyMinutes = formData.duration === 'custom'
      ? Number(formData.customDuration) || 0
      : Number(formData.duration) || 0;

    const breakMinutes = formData.breakDuration === 'custom'
      ? Number(formData.customBreakDuration) || 0
      : Number(formData.breakDuration) || 0;

    // Validation
    if (!studyMinutes || studyMinutes < 5 || studyMinutes > 480) {
      alert('Please enter a valid study duration between 5-480 minutes');
      return;
    }

    if (!breakMinutes || breakMinutes < 1 || breakMinutes > 60) {
      alert('Please enter a valid break duration between 1-60 minutes');
      return;
    }

    try {
      const sessionPayload = {
        subject: formData.subject,
        studyMinutes: studyMinutes,
        breakMinutes: breakMinutes,
        resources: formData.resources.map(r => ({
          title: r.title,
          resourceType: r.resourceType || 'resource',
          url: r.url,
          file: r.file
        }))
      };

      const response = await studyWithMeAPI.startSession(sessionPayload);

      const totalSeconds = studyMinutes * 60;

      // Initialize session data based on timer mode
      let initialSessionData;

      if (formData.timerMode === 'pomodoro') {
        // Parse pomodoro type
        const [workStr, breakStr] = formData.pomodoroType.split('/');
        const pomodoroWorkMinutes = parseInt(workStr);
        const pomodoroBreakMinutes = parseInt(breakStr);

        initialSessionData = {
          sessionId: response.data.data.session._id,
          startTime: new Date(),
          notes: '',
          mode: 'studying',
          studySecondsLeft: pomodoroWorkMinutes * 60,
          breakSecondsLeft: pomodoroBreakMinutes * 60,
          totalSecondsLeft: totalSeconds,
          breaksTaken: 0,
          currentCycle: 1,
          cyclePhase: 'work',
          pomodoroWorkMinutes,
          pomodoroBreakMinutes
        };
      } else {
        // Normal mode
        const breakSeconds = breakMinutes * 60;

        initialSessionData = {
          sessionId: response.data.data.session._id,
          startTime: new Date(),
          notes: '',
          mode: 'studying',
          studySecondsLeft: totalSeconds,
          breakSecondsLeft: breakSeconds,
          totalSecondsLeft: totalSeconds,
          breaksTaken: 0,
          currentCycle: 0,
          cyclePhase: 'work',
          pomodoroWorkMinutes: 0,
          pomodoroBreakMinutes: 0
        };
      }

      setSessionData(initialSessionData);
      setStep('studying');
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start study session. Please try again.');
    }
  };

  const handleTakeBreak = () => {
    const breakMinutes = formData.breakDuration === 'custom'
      ? Number(formData.customBreakDuration) || 5
      : Number(formData.breakDuration) || 5;

    setSessionData(prev => ({
      ...prev,
      mode: 'break',
      breakSecondsLeft: breakMinutes * 60
    }));
  };

  const handleResumeStudy = () => {
    setSessionData(prev => ({
      ...prev,
      mode: 'studying',
      breaksTaken: prev.breaksTaken + 1
    }));
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this study session?')) {
      handleSessionComplete();
    }
  };

  const handleSessionComplete = async () => {
    try {
      await studyWithMeAPI.endSession(sessionData.sessionId, {
        notes: sessionData.notes
      });
      setStep('completed');
    } catch (error) {
      console.error('Failed to save session:', error);
      // Still show completion even if save fails
      setStep('completed');
    }
  };

  const handleResourceToggle = (resource) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.find(r => r._id === resource._id)
        ? prev.resources.filter(r => r._id !== resource._id)
        : [...prev.resources, resource]
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'setup') {
    return (
      <div className="study-with-me-container">
        <div className="study-setup">
          <h1>📚 Study With Me</h1>
          <p>Focus deeply on your studies in a distraction-free environment.</p>

          <div className="setup-form">
            <div className="form-group">
              <label>Timer Mode</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label>
                  <input
                    type="radio"
                    value="normal"
                    checked={formData.timerMode === 'normal'}
                    onChange={(e) => setFormData(prev => ({ ...prev, timerMode: e.target.value }))}
                  />
                  Normal Timer
                </label>
                <label>
                  <input
                    type="radio"
                    value="pomodoro"
                    checked={formData.timerMode === 'pomodoro'}
                    onChange={(e) => setFormData(prev => ({ ...prev, timerMode: e.target.value }))}
                  />
                  Pomodoro Timer
                </label>
              </div>
            </div>

            {formData.timerMode === 'pomodoro' && (
              <div className="form-group">
                <label>Pomodoro Cycle</label>
                <select
                  value={formData.pomodoroType}
                  onChange={(e) => setFormData(prev => ({ ...prev, pomodoroType: e.target.value }))}
                >
                  <option value="25/5">25 minutes work / 5 minutes break</option>
                  <option value="50/10">50 minutes work / 10 minutes break</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Study Duration</label>
              <select
                value={formData.duration}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    duration: e.target.value === 'custom'
                      ? 'custom'
                      : parseInt(e.target.value),
                    customDuration: '' // Reset custom duration when switching
                  }))
                }
              >
                <option value={25}>25 minutes</option>
                <option value={50}>50 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={300}>5 hours</option>
                <option value={360}>6 hours</option>
                <option value={420}>7 hours</option>
                <option value={480}>8 hours</option>
                <option value="custom">Custom</option>
              </select>

              {formData.duration === 'custom' && (
                <input
                  type="number"
                  min={5}
                  max={480}
                  placeholder="Enter minutes (e.g. 180)"
                  value={formData.customDuration}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      customDuration: parseInt(e.target.value) || ''
                    }))
                  }
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>

            <div className="form-group">
              <label>Break Duration</label>
              <select
                value={formData.breakDuration}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    breakDuration: e.target.value === 'custom'
                      ? 'custom'
                      : parseInt(e.target.value),
                    customBreakDuration: '' // Reset custom break duration when switching
                  }))
                }
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value="custom">Custom</option>
              </select>

              {formData.breakDuration === 'custom' && (
                <input
                  type="number"
                  min={1}
                  max={60}
                  placeholder="Enter minutes (e.g. 7)"
                  value={formData.customBreakDuration}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      customBreakDuration: parseInt(e.target.value) || ''
                    }))
                  }
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>

            <div className="form-group">
              <label>Subject / Topic</label>
              <input
                type="text"
                placeholder="e.g., AI, Math, DSA, Physics"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Resources (Optional)</label>
              <div className="resources-selector">
                {availableResources.length > 0 ? (
                  <div className="resources-list">
                    {availableResources.map(resource => (
                      <div key={resource._id} className="resource-item">
                        <input
                          type="checkbox"
                          id={`resource-${resource._id}`}
                          checked={formData.resources.some(r => r._id === resource._id)}
                          onChange={() => handleResourceToggle(resource)}
                        />
                        <label htmlFor={`resource-${resource._id}`}>
                          <span className="resource-title">{resource.title}</span>
                          <span className="resource-group">({resource.groupName})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-resources">No resources available. Join a group to access study materials.</p>
                )}
              </div>
            </div>

            <button className="start-session-btn" onClick={handleStartSession}>
              🚀 Start Studying
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'studying') {
    const currentTimeLeft = sessionData.mode === 'studying'
      ? sessionData.studySecondsLeft
      : sessionData.breakSecondsLeft;

    const modeLabel = sessionData.pomodoroWorkMinutes > 0
      ? `Pomodoro #${sessionData.currentCycle} - ${sessionData.cyclePhase === 'work' ? 'Work' : 'Break'}`
      : (sessionData.mode === 'studying' ? 'Study Time' : 'Break Time');

    return (
      <div className={`study-with-me-container studying ${sessionData.mode === 'break' ? 'on-break' : ''}`}>
        <div className="study-timer-section">
          <div className="timer-display">
            <div className="timer-circle">
              <span className="timer-text">{formatTime(currentTimeLeft)}</span>
            </div>
            <div className="mode-indicator">
              {modeLabel}
            </div>
          </div>

          <div className="timer-controls">
            {sessionData.mode === 'studying' ? (
              <>
                {sessionData.pomodoroWorkMinutes === 0 && (
                  <button className="control-btn break" onClick={handleTakeBreak}>
                    🧘 Take a Break ({formData.breakDuration === 'custom' ? formData.customBreakDuration : formData.breakDuration}m)
                  </button>
                )}
                <button className="control-btn end" onClick={handleEndSession}>
                  🏁 End Session
                </button>
              </>
            ) : (
              <>
                {sessionData.pomodoroWorkMinutes === 0 && (
                  <button className="control-btn resume" onClick={handleResumeStudy}>
                    ▶️ Resume Study
                  </button>
                )}
                <button className="control-btn end" onClick={handleEndSession}>
                  🏁 End Session
                </button>
              </>
            )}
          </div>
        </div>

        <div className="study-content">
          <div className="notes-section">
            <h3>📝 Notes</h3>
            <textarea
              className="notes-editor"
              placeholder="Take notes during your study session..."
              value={sessionData.notes}
              onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {formData.resources.length > 0 && (
            <div className="resources-section">
              <h3>📚 Resources</h3>
              <div className="resources-grid">
                {formData.resources.map(resource => (
                  <div key={resource._id} className="resource-card">
                    <h4>{resource.title}</h4>
                    <p>{resource.description || 'No description'}</p>
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Open Resource →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'completed') {
    return (
      <div className="study-with-me-container completed">
        <div className="completion-modal">
          <h1>🎉 Session Complete!</h1>
          <div className="session-summary">
            <p><strong>Subject:</strong> {formData.subject}</p>
            <p><strong>Timer Mode:</strong> {formData.timerMode === 'pomodoro' ? 'Pomodoro' : 'Normal'}</p>
            {formData.timerMode === 'pomodoro' && (
              <>
                <p><strong>Pomodoro Type:</strong> {formData.pomodoroType}</p>
                <p><strong>Cycles Completed:</strong> {sessionData.currentCycle - 1}</p>
              </>
            )}
            <p><strong>Study Duration:</strong> {
              formData.duration === 'custom'
                ? `${formData.customDuration} minutes`
                : `${formData.duration} minutes`
            }</p>
            <p><strong>Break Duration:</strong> {
              formData.breakDuration === 'custom'
                ? `${formData.customBreakDuration} minutes`
                : `${formData.breakDuration} minutes`
            }</p>
            <p><strong>Breaks Taken:</strong> {sessionData.breaksTaken}</p>
            <p><strong>Notes:</strong> {sessionData.notes || 'No notes taken'}</p>
          </div>

          <div className="completion-actions">
            <button className="action-btn primary" onClick={() => window.location.reload()}>
              Study Again
            </button>
            <button className="action-btn secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StudyWithMe;
