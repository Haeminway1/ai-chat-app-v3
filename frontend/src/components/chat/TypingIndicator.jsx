import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <div className="typing-container">
        <div className="typing-header">AI</div>
        <div className="typing-animation">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="typing-text">Writing response...</div>
      </div>
    </div>
  );
};

export default TypingIndicator;