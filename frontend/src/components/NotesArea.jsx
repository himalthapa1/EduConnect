import React from 'react';
import NotesCard from './NotesCard';
import './NotesArea.css';

const NotesArea = ({ 
  sessionData, 
  onNotesChange, 
  activePdf, 
  showPdfDrawer, 
  onClosePdfDrawer 
}) => {
  return (
    <div className="notes-area">
      <NotesCard
        notes={sessionData.notes}
        onNotesChange={onNotesChange}
        activePdf={activePdf}
        showPdfDrawer={showPdfDrawer}
        onClosePdfDrawer={onClosePdfDrawer}
      />
    </div>
  );
};

export default NotesArea;