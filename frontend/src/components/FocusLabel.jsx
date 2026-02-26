import React from 'react';
import './FocusLabel.css';

const FocusLabel = ({ mode, subject, isPomodoro, currentCycle, cyclePhase }) => {
  return (
    <div className="focus-label">
      <div className="mode-indicator">
        {mode === 'break' ? 'On Break' : 'Focus Mode'}
      </div>
      {subject && (
        <div className="subject-info">
          <span className="subject-label">Subject:</span>
          <span className="subject-value">{subject}</span>
        </div>
      )}
      {isPomodoro && (
        <div className="pomodoro-info">
          <span className="cycle-label">Cycle:</span>
          <span className="cycle-value">
            {cyclePhase === 'work' ? 'Work' : 'Break'} {currentCycle}
          </span>
        </div>
      )}
    </div>
  );
};

export default FocusLabel;