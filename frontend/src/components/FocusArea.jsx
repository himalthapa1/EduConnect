import React from 'react';
import TimerCircle from './TimerCircle';
import FocusLabel from './FocusLabel';
import ControlsRow from './ControlsRow';
import './FocusArea.css';

const FocusArea = ({ 
  sessionData, 
  formData, 
  showResourceList, 
  onToggleResourceList, 
  onTakeBreak, 
  onResumeStudy, 
  onEndSession, 
  onResourceClick, 
  onClosePdfDrawer, 
  activePdf, 
  showPdfDrawer 
}) => {
  const currentTimeLeft = sessionData.mode === 'studying'
    ? sessionData.studySecondsLeft
    : sessionData.breakSecondsLeft;

  return (
    <div className="focus-area">
      <div className="timer-section">
        <TimerCircle 
          timeLeft={currentTimeLeft}
          mode={sessionData.mode}
          isPomodoro={formData.timerMode === 'pomodoro'}
        />
        <FocusLabel 
          mode={sessionData.mode}
          subject={formData.subject}
          isPomodoro={formData.timerMode === 'pomodoro'}
          currentCycle={sessionData.currentCycle}
          cyclePhase={sessionData.cyclePhase}
        />
      </div>
      
      <ControlsRow
        sessionData={sessionData}
        formData={formData}
        showResourceList={showResourceList}
        onToggleResourceList={onToggleResourceList}
        onTakeBreak={onTakeBreak}
        onResumeStudy={onResumeStudy}
        onEndSession={onEndSession}
        onResourceClick={onResourceClick}
        activePdf={activePdf}
        showPdfDrawer={showPdfDrawer}
        onClosePdfDrawer={onClosePdfDrawer}
      />
    </div>
  );
};

export default FocusArea;