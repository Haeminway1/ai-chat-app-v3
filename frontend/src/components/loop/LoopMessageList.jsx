import React, { useEffect, useRef, useState } from 'react';
import LoopMessage from './LoopMessage';
import './LoopMessageList.css';

const LoopMessageList = ({ loop }) => {
  const messagesEndRef = useRef(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isNewMessage, setIsNewMessage] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track message count changes to detect new messages
  useEffect(() => {
    if (loop?.messages) {
      const currentCount = loop.messages.length;
      
      // Check if we have a new message
      if (currentCount > lastMessageCount) {
        setIsNewMessage(true);
        
        // Reset the new message indicator after 1 second
        const timer = setTimeout(() => {
          setIsNewMessage(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
      
      setLastMessageCount(currentCount);
    }
  }, [loop?.messages, lastMessageCount]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [loop?.messages]);

  // 채팅 로그가 없는 경우 (채팅 로그가 없거나 loop가 없는 경우)
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
      model: p.model,
      systemPrompt: p.system_prompt
    };
  });

  return (
    <div className={`loop-message-list ${isNewMessage ? 'new-message-highlight' : ''}`}>
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