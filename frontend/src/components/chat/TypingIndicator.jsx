import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <div className="typing-indicator-bubble">
        <div className="typing-indicator-dot"></div>
        <div className="typing-indicator-dot"></div>
        <div className="typing-indicator-dot"></div>
      </div>
      <div className="typing-indicator-text">AI is thinking...</div>
    </div>
  );
};

export default TypingIndicator;