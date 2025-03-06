import React from 'react';
import './LoopMessage.css';

const LoopMessage = ({ message, participantInfo }) => {
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
  
  const getMessageClass = () => {
    if (message.sender === 'user') {
      return 'loop-message-user';
    }
    
    if (message.sender === 'system') {
      return 'loop-message-system';
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
  
  return (
    <div className={`loop-message ${getMessageClass()}`}>
      <div className="loop-message-header">
        <div className="loop-message-sender">{getSenderName()}</div>
        {getSenderModel() && <div className="loop-message-model">{getSenderModel()}</div>}
      </div>
      <div className="loop-message-content">
        {message.content}
      </div>
      <div className="loop-message-timestamp">
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
  );
};

export default LoopMessage;