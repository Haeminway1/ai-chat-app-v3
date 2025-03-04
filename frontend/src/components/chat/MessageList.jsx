import React, { useEffect, useRef } from 'react';
import './MessageList.css';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!messages || messages.length === 0) {
    return (
      <div className="empty-messages">
        <p>No messages yet. Start typing to begin a conversation.</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map(message => (
        <div 
          key={message.id}
          className={`message message-${message.role}`}
        >
          <div className="message-header">
            {message.role === 'user' ? 'You' : 
             message.role === 'assistant' ? 'AI' : 'System'}
          </div>
          <div className="message-content">
            {message.content}
          </div>
          <div className="message-timestamp">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;