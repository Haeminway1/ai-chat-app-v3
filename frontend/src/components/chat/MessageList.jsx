import React, { useEffect, useRef, useLayoutEffect } from 'react';
import './MessageList.css';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  // 더 강력한 스크롤 처리를 위한 함수
  const scrollToBottom = () => {
    // 1. messagesEndRef를 사용한 스크롤
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
    
    // 2. 부모 컨테이너를 직접 스크롤
    const parentContainer = messageListRef.current?.parentElement;
    if (parentContainer) {
      parentContainer.scrollTop = parentContainer.scrollHeight;
    }
  };

  // useLayoutEffect는 DOM이 업데이트된 직후, 브라우저가 화면을 그리기 전에 실행됨
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 일반 useEffect도 추가로 사용
  useEffect(() => {
    scrollToBottom();
    
    // 약간의 지연 후 다시 스크롤
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  // 시스템 메시지를 제외한 메시지만 표시
  const filteredMessages = messages.filter(message => message.role !== 'system');

  if (!filteredMessages || filteredMessages.length === 0) {
    return (
      <div className="empty-messages">
        <p>No messages yet. Start typing to begin a conversation.</p>
      </div>
    );
  }

  return (
    <div className="message-list" ref={messageListRef}>
      {filteredMessages.map((message, index) => (
        <div 
          key={message.id || index}
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
      <div ref={messagesEndRef} style={{float: "left", clear: "both", height: "5px", width: "100%", marginTop: "20px", marginBottom: "20px"}} />
    </div>
  );
};

export default MessageList;