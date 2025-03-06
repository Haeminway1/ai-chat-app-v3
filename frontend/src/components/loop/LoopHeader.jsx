import React, { useState } from 'react';
import './LoopHeader.css';

const LoopHeader = ({ loop, onTitleChange, onSettingsClick }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(loop?.title || '');

  const handleStartEditTitle = () => {
    setNewTitle(loop?.title || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (newTitle.trim()) {
      await onTitleChange(newTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setNewTitle(loop?.title || '');
    }
  };

  if (!loop) return null;

  const getStatusText = (status) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      case 'stopped':
        return 'Stopped';
      default:
        return 'Ready';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'running':
        return 'status-running';
      case 'paused':
        return 'status-paused';
      case 'stopped':
        return 'status-stopped';
      default:
        return '';
    }
  };

  return (
    <div className="loop-header">
      <div className="loop-title-section">
        {isEditingTitle ? (
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="loop-title-input"
          />
        ) : (
          <h2 className="loop-title-display" onClick={handleStartEditTitle}>{loop.title}</h2>
        )}
      </div>
      
      <div className="loop-status-section">
        <div className={`loop-status ${getStatusClass(loop.status)}`}>
          <span className="status-indicator"></span>
          <span className="status-text">{getStatusText(loop.status)}</span>
        </div>
        <div className="participant-count">
          {loop.participants.length} participant{loop.participants.length !== 1 ? 's' : ''}
        </div>
        <button 
          className="settings-button" 
          title="Settings"
          onClick={onSettingsClick}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default LoopHeader;