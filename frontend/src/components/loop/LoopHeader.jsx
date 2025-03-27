import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiRefreshCw } from 'react-icons/fi';
import { useLoop } from '../../contexts/LoopContext';
import './LoopHeader.css';

const LoopHeader = () => {
  const { currentLoop, updateLoopTitle } = useLoop();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (currentLoop) {
      setTitle(currentLoop.title || 'Untitled Loop');
    }
  }, [currentLoop]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleSaveTitle = () => {
    if (currentLoop && title.trim() !== '') {
      updateLoopTitle(title.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitle(currentLoop?.title || 'Untitled Loop');
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setTitle(currentLoop?.title || 'Untitled Loop');
    setIsEditing(false);
  };

  if (!currentLoop) return null;

  return (
    <div className="loop-header">
      <div className="loop-title-container">
        <FiRefreshCw className="loop-icon" />
        {isEditing ? (
          <>
            <input
              ref={inputRef}
              type="text"
              className="loop-title-editable"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveTitle}
              placeholder="Enter loop title"
              maxLength={60}
            />
            <div className="title-edit-controls">
              <button className="save-button" onClick={handleSaveTitle}>
                Save
              </button>
              <button className="cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <h1 className="loop-title" onClick={handleTitleClick}>
            {title || 'Untitled Loop'}
          </h1>
        )}
      </div>
      
      <div className="loop-controls-container">
        <button className="loop-actions-button">
          <FiSettings />
        </button>
      </div>
    </div>
  );
};

export default LoopHeader;