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
  const [showResourceList, setShowResourceList] = useState(false);
  const [activePdf, setActivePdf] = useState(null);
  const [showPdfDrawer, setShowPdfDrawer] = useState(false);
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
          const resourceData = resResponse.data.data || {};
          const sharedResources = resourceData.shared || [];
          const privateResources = resourceData.private || [];
          const allGroupResources = [...sharedResources, ...privateResources];
          allResources.push(...allGroupResources.map(r => ({ ...r, groupName: group.name })));
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
    console.log('=== START SESSION DEBUG ===');
    console.log('formData:', formData);
    console.log('subject trimmed:', formData.subject.trim());

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

    console.log('studyMinutes:', studyMinutes, 'breakMinutes:', breakMinutes);

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
        subject: formData.subject.trim(),
        studyMinutes: studyMinutes,
        breakMinutes: breakMinutes,
        resources: formData.resources.map(r => ({
          title: r.title,
          resourceType: r.resourceType || 'resource',
          url: r.url,
          file: r.file
        }))
      };

      console.log('=== AUTH DEBUG ===');
      console.log('Token in localStorage:', localStorage.getItem('token'));
      console.log('Payload:', sessionPayload);

      // Test if the API instance has the interceptor working
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);

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

      // Check if it's because of an active session
      if (error.response?.data?.error?.message?.includes('active study session')) {
        const resumeSession = window.confirm(
          'You already have an active study session. Would you like to resume it instead of starting a new one?\n\n' +
          'Click OK to resume your existing session, or Cancel to go to Dashboard and manage your sessions.'
        );

        if (resumeSession) {
          // Try to fetch and resume the active session
          try {
            const activeResponse = await studyWithMeAPI.getActiveSession();
            if (activeResponse.data.data.session) {
              const session = activeResponse.data.data.session;

              // Calculate remaining time more accurately
              const startTime = new Date(session.startTime);
              const now = new Date();
              const elapsedSeconds = Math.floor((now - startTime) / 1000);
              const totalStudySeconds = session.studyMinutes * 60;
              const remainingSeconds = Math.max(0, totalStudySeconds - elapsedSeconds);

              // For now, assume studying mode and create basic session data
              // In a more advanced implementation, you'd track the exact state
              setFormData(prev => ({
                ...prev,
                subject: session.subject,
                timerMode: 'normal', // Default assumption
                duration: session.studyMinutes,
                breakDuration: session.breakMinutes,
                resources: session.resources || []
              }));

              setSessionData({
                sessionId: session._id,
                startTime: startTime,
                notes: session.notes || '',
                mode: 'studying',
                studySecondsLeft: remainingSeconds,
                breakSecondsLeft: session.breakMinutes * 60,
                totalSecondsLeft: remainingSeconds,
                breaksTaken: 0, // This info not available in current API
                currentCycle: 0,
                cyclePhase: 'work',
                pomodoroWorkMinutes: 0,
                pomodoroBreakMinutes: 0
              });
              setStep('studying');
              return;
            }
          } catch (resumeError) {
            console.error('Failed to resume session:', resumeError);
            alert('Could not resume your session. Please try ending your current session first.');
          }
        }

        // If user doesn't want to resume or resume failed, go to dashboard
        navigate('/dashboard');
        return;
      }

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

  const handleResourceClick = (resource) => {
    // Check if it's a PDF (by file extension or resource type)
    const isPdf = resource.file?.toLowerCase().endsWith('.pdf') ||
                  resource.resourceType === 'pdf' ||
                  resource.title?.toLowerCase().includes('.pdf');

    if (isPdf) {
      setActivePdf(resource);
      setShowPdfDrawer(true);
      setShowResourceList(false);
    } else {
      // For non-PDF resources, open in new tab as before
      if (resource.url) {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      }
      setShowResourceList(false);
    }
  };

  const closePdfDrawer = () => {
    setShowPdfDrawer(false);
    setActivePdf(null);
  };

  // Keyboard shortcut for closing drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPdfDrawer) {
        closePdfDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPdfDrawer]);

  if (step === 'setup') {
    return (
      <div className="study-with-me-container">
        <div className="study-setup">
          <h1>📚 Study With Me</h1>
          <p>Focus deeply on your studies in a distraction-free environment.</p>

          <div className="setup-form">
            <div className="form-group">
              <label>Timer Mode</label>
              <div className="segmented-control">
                <button
                  type="button"
                  className={formData.timerMode === 'normal' ? 'active' : ''}
                  onClick={() => setFormData(prev => ({ ...prev, timerMode: 'normal' }))}
                >
                  Normal Timer
                </button>
                <button
                  type="button"
                  className={formData.timerMode === 'pomodoro' ? 'active' : ''}
                  onClick={() => setFormData(prev => ({ ...prev, timerMode: 'pomodoro' }))}
                >
                  Pomodoro
                </button>
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
              <small>Used to personalize your study history</small>
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



    return (
      <div className={`study-with-me-container studying ${sessionData.mode === 'break' ? 'on-break' : ''} ${showPdfDrawer ? 'pdf-drawer-open' : ''}`}>
        <div className="study-timer-section">
          <div className="timer-display">
            <div className="timer-circle">
              <span className="timer-text">{formatTime(currentTimeLeft)}</span>
              <div className="timer-label">Focus</div>
            </div>
          </div>



          <div className="timer-controls">
            <button
              className="control-btn resources"
              onClick={() => setShowResourceList(!showResourceList)}
              title="Access study resources"
            >
              📎 Resources ({formData.resources.length})
            </button>

            {showResourceList && (
              <div className="resources-dropdown">
                <div className="resources-list">
                  {formData.resources.length > 0 ? (
                    formData.resources.map(resource => (
                      <button
                        key={resource._id}
                        className="resource-item-btn"
                        onClick={() => handleResourceClick(resource)}
                        title={`Open ${resource.title}`}
                      >
                        <span className="resource-title">{resource.title}</span>
                        <span className="resource-type">
                          {resource.file?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Link'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="no-session-resources">
                      No resources attached to this session
                      <br />
                      <small>Go back to setup to add resources</small>
                    </div>
                  )}
                </div>
              </div>
            )}

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
          <div className={`notes-section ${showPdfDrawer ? 'with-pdf' : ''}`}>
            {showPdfDrawer && activePdf && (
              <div className="pdf-in-notes">
                <div className="pdf-header">
                  <h4>{activePdf.title}</h4>
                  <button
                    className="pdf-close-btn"
                    onClick={closePdfDrawer}
                    title="Close PDF (Esc)"
                  >
                    ✕
                  </button>
                </div>
                <div className="pdf-viewer-small">
                  <iframe
                    src={`/${activePdf.file}`}
                    title={activePdf.title}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            )}

            <div className="notes-content">
              <h3>📝 Notes</h3>
              <textarea
                className="notes-editor"
                placeholder="Jot down thoughts, formulas, or ideas while you focus..."
                value={sessionData.notes}
                onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
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
