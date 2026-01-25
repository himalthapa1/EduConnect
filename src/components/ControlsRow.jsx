import React from 'react';
import { Icons } from '../ui/icons';
import './ControlsRow.css';

const ControlsRow = ({
  sessionData,
  formData,
  showResourceList,
  onToggleResourceList,
  onTakeBreak,
  onResumeStudy,
  onEndSession,
  onResourceClick,
  activePdf,
  showPdfDrawer,
  onClosePdfDrawer
}) => {
  const handleResourceClick = (resource) => {
    onResourceClick(resource);
  };

  const closePdfDrawer = () => {
    onClosePdfDrawer();
  };

  return (
    <div className="controls-row">
      <div className="timer-controls">
        <button
          className="control-btn resources"
          onClick={onToggleResourceList}
          title="Access study resources"
        >
          <Icons.file size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Resources ({formData.resources.length})
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
            <button className="control-btn break" onClick={onTakeBreak}>
              <Icons.coffee size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Take a Break ({formData.breakDuration === 'custom' ? formData.customBreakDuration : formData.breakDuration}m)
            </button>
            <button className="control-btn end" onClick={onEndSession}>
              <Icons.checkCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> End Session
            </button>
          </>
        ) : (
          <>
            <button className="control-btn resume" onClick={onResumeStudy}>
              <Icons.play size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Resume Study
            </button>
            <button className="control-btn end" onClick={onEndSession}>
              <Icons.checkCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> End Session
            </button>
          </>
        )}
      </div>

      {/* PDF Drawer */}
      {showPdfDrawer && activePdf && (
        <div className="pdf-drawer">
          <div className="pdf-drawer-header">
            <h4>{activePdf.title}</h4>
            <button
              className="pdf-close-btn"
              onClick={closePdfDrawer}
              title="Close PDF (Esc)"
            >
              <Icons.close size={18} />
            </button>
          </div>
          <div className="pdf-viewer">
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
    </div>
  );
};

export default ControlsRow;