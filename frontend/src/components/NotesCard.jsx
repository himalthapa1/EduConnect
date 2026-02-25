import React from 'react';
import { Icons } from '../ui/icons';
import './NotesCard.css';

const NotesCard = ({ 
  notes, 
  onNotesChange, 
  activePdf, 
  showPdfDrawer, 
  onClosePdfDrawer 
}) => {
  const closePdfDrawer = () => {
    onClosePdfDrawer();
  };

  // Keyboard shortcut for closing drawer
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPdfDrawer) {
        closePdfDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPdfDrawer]);

  return (
    <div className={`notes-card ${showPdfDrawer ? 'with-pdf' : ''}`}>
      {showPdfDrawer && activePdf && (
        <div className="pdf-in-notes">
          <div className="pdf-header">
            <h4>{activePdf.title}</h4>
            <button
              className="pdf-close-btn"
              onClick={closePdfDrawer}
              title="Close PDF (Esc)"
            >
              <Icons.close size={18} />
            </button>
          </div>
          <div className="pdf-viewer-small">
            <iframe
              src={`/uploads/${activePdf.file}`}
              title={activePdf.title}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}

      <div className="notes-content">
        <h3><Icons.edit size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Notes</h3>
        <textarea
          className="notes-editor"
          placeholder="Jot down thoughts, formulas, or ideas while you focus..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default NotesCard;