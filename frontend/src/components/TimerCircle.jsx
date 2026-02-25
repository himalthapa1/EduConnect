import React from 'react';
import './TimerCircle.css';

const TimerCircle = ({ timeLeft, mode, isPomodoro }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCircleClass = () => {
    if (mode === 'break') {
      return 'timer-circle break-mode';
    }
    return 'timer-circle';
  };

  return (
    <div className="timer-display">
      <div className={getCircleClass()}>
        <span className="timer-text">{formatTime(timeLeft)}</span>
        <div className="timer-label">
          {mode === 'break' ? 'Break' : 'Focus'}
        </div>
      </div>
    </div>
  );
};

export default TimerCircle;