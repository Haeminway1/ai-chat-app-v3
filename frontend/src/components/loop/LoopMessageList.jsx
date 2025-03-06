import React, { useEffect, useRef } from 'react';
import LoopMessage from './LoopMessage';
import './LoopMessageList.css';

const LoopMessageList = ({ loop }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [loop?.messages]);

  if (!loop?.messages || loop.messages.length === 0) {
    return (
      <div className="empty-loop-messages">
        <p>This loop has no messages yet. Configure participants and start the loop to begin the conversation.</p>
      </div>
    );
  }

  // Create a map of participant IDs to their display names and models
  const participantInfo = {};
  loop.participants.forEach(p => {
    participantInfo[p.id] = {
      displayName: p.display_name,
      model: p.model
    };
  });

  return (
    <div className="loop-message-list">
      {loop.messages.map(message => (
        <LoopMessage 
          key={message.id}
          message={message}
          participantInfo={participantInfo}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default LoopMessageList;