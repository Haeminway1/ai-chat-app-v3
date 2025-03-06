import React, { useState } from 'react';
import './LoopMessage.css';

const LoopMessage = ({ message, participantInfo }) => {
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  
  const getSenderName = () => {
    if (message.sender === 'user') {
      return 'You';
    }
    
    if (message.sender === 'system') {
      return 'System';
    }
    
    // Get participant info
    const participant = participantInfo[message.sender];
    if (participant) {
      return participant.displayName;
    }
    
    return 'Unknown';
  };
  
  const getSenderModel = () => {
    if (message.sender === 'user' || message.sender === 'system') {
      return '';
    }
    
    // Get participant info
    const participant = participantInfo[message.sender];
    if (participant) {
      return participant.model;
    }
    
    return '';
  };
  
  const getSystemPrompt = () => {
    if (message.sender === 'user' || message.sender === 'system') {
      return '';
    }
    
    // Get participant info
    const participant = participantInfo[message.sender];
    if (participant && participant.systemPrompt) {
      return participant.systemPrompt;
    }
    
    return 'No system prompt';
  };
  
  const getMessageClass = () => {
    if (message.sender === 'user') {
      return 'loop-message-user';
    }
    
    if (message.sender === 'system') {
      return 'loop-message-system';
    }
    
    // Check if this is a "thinking" message
    if (message.content === 'Thinking...') {
      return 'loop-message-ai loop-message-thinking';
    }
    
    return 'loop-message-ai';
  };
  
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return '';
    }
  };
  
  // Render thinking indicator for real-time feedback
  const renderContent = () => {
    if (message.content === 'Thinking...') {
      return (
        <div className="thinking-indicator">
          <span className="thinking-dot"></span>
          <span className="thinking-dot"></span>
          <span className="thinking-dot"></span>
          <span>Thinking</span>
        </div>
      );
    }
    
    return message.content;
  };
  
  const toggleSystemPrompt = () => {
    setShowSystemPrompt(!showSystemPrompt);
  };
  
  const hasSystemPrompt = message.sender !== 'user' && message.sender !== 'system' && participantInfo[message.sender]?.systemPrompt;
  
  // Get a short preview of the system prompt
  const getSystemPromptPreview = () => {
    const systemPrompt = getSystemPrompt();
    if (!systemPrompt) return '';
    
    // Get first 20 characters or first line
    const firstLine = systemPrompt.split('\n')[0];
    return firstLine.length > 20 ? firstLine.substring(0, 20) + '...' : firstLine;
  };
  
  return (
    <div className={`loop-message ${getMessageClass()}`}>
      <div className="loop-message-header">
        <div className="loop-message-sender">
          {getSenderName()}
          {hasSystemPrompt && (
            <span className="system-prompt-preview" onClick={toggleSystemPrompt}>
              ({getSystemPromptPreview()})
            </span>
          )}
        </div>
        {getSenderModel() && (
          <div className="loop-message-model">
            {getSenderModel()}
            {hasSystemPrompt && (
              <button 
                className="system-prompt-toggle"
                onClick={toggleSystemPrompt}
                title="Show/hide system prompt"
              >
                {showSystemPrompt ? '−' : '+'}
              </button>
            )}
          </div>
        )}
      </div>
      
      {showSystemPrompt && hasSystemPrompt && (
        <div className="loop-message-system-prompt">
          <strong>System Prompt:</strong>
          <div className="system-prompt-content">{getSystemPrompt()}</div>
        </div>
      )}
      
      <div className="loop-message-content">
        {renderContent()}
      </div>
      <div className="loop-message-timestamp">
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
  );
};

export default LoopMessage;