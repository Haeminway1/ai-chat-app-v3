import React, { useEffect, useRef, useState } from 'react';
import LoopMessage from './LoopMessage';
import './LoopMessageList.css';

const LoopMessageList = ({ messages, participants, className }) => {
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const prevMessagesRef = useRef([]);
  
  // Track message updates more reliably
  useEffect(() => {
    if (messages) {
      const currentCount = messages.length;
      
      // Check if we have new messages by comparing lengths and content
      const hasNewMessages = currentCount > lastMessageCount;
      
      if (hasNewMessages) {
        setIsNewMessage(true);
        setLastMessageCount(currentCount);
        
        // Schedule scrolling after render
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        // Remove highlight effect after animation finishes
        const timer = setTimeout(() => {
          setIsNewMessage(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
      
      // Update previous messages reference
      prevMessagesRef.current = messages;
    }
  }, [messages, lastMessageCount]);

  // Initial scroll on first render
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Add a small delay to ensure render is complete
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, []); 

  // Scroll helper
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use scroll into view with behavior smooth for better UX
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
      
      // Fallback for older browsers
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }
  };

  // Handle empty messages case
  if (!messages || messages.length === 0) {
    return (
      <div className="empty-loop-messages">
        <p>This loop has no messages yet. Configure participants and start the loop to begin the conversation.</p>
      </div>
    );
  }

  // Find participant by ID
  const findParticipant = (participantId) => {
    if (!participantId || participantId === "user") {
      return { display_name: "Initial Input" };
    }
    return participants?.find(p => p.id === participantId) || { display_name: 'Unknown' };
  };

  // Log for debugging
  console.log(`Rendering message list with ${messages.length} messages`);

  return (
    <div 
      className={`loop-message-list ${isNewMessage ? 'new-message-highlight' : ''} ${className || ''}`}
      ref={listRef}
    >
      {messages.map((message, index) => {
        const participant = findParticipant(message.sender || message.participant_id);
        return (
          <LoopMessage
            key={message.id || index}
            message={message}
            participant={participant}
            isLast={index === messages.length - 1}
          />
        );
      })}
      <div 
        ref={messagesEndRef} 
        style={{ 
          float: "left", 
          clear: "both", 
          padding: "1px",
          width: "100%",
          height: "1px" 
        }} 
      />
    </div>
  );
};

export default LoopMessageList;