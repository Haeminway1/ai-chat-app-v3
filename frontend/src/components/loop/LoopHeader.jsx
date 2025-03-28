import React, { useState, useEffect, useRef } from 'react';
import './LoopHeader.css';

const LoopHeader = ({ loop, onTitleChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (loop) {
      setTitle(loop.title || 'Untitled Loop');
    }
  }, [loop]);

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
    if (loop && title.trim() !== '' && onTitleChange) {
      onTitleChange(title.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitle(loop?.title || 'Untitled Loop');
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setTitle(loop?.title || 'Untitled Loop');
    setIsEditing(false);
  };

  if (!loop) return null;

  return (
    <div className="loop-header">
      <div className="loop-title-container">
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
    </div>
  );
};

export default LoopHeader;