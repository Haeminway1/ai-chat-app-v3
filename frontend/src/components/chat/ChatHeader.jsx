import React, { useState } from 'react';
import './ChatHeader.css';

const ChatHeader = ({ chat, onTitleChange }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(chat?.title || '');

  const handleStartEditTitle = () => {
    setNewTitle(chat?.title || '');
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
      setNewTitle(chat?.title || '');
    }
  };

  if (!chat) return null;

  return (
    <div className="chat-header">
      <div className="chat-title">
        {isEditingTitle ? (
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="chat-title-input"
          />
        ) : (
          <h2 onClick={handleStartEditTitle}>{chat.title}</h2>
        )}
      </div>
      <div className="chat-model-info">
        <span>{chat.model}</span>
      </div>
    </div>
  );
};

export default ChatHeader;