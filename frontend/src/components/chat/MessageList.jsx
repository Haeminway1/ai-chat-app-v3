import React, { useEffect, useRef, useLayoutEffect } from 'react';
import './MessageList.css';
import TypingIndicator from './TypingIndicator';
import { useChat } from '../../contexts/ChatContext';

const MessageList = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const { sendChatMessage, currentChat, loadChat } = useChat();

  // Debug log messages
  useEffect(() => {
    console.log("MessageList rendering with messages:", messages);
    console.log("isTyping state:", isTyping);
  }, [messages, isTyping]);

  // Scroll handling function
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
    
    // 약간의 지연 후 다시 스크롤 - 여러 번 시도하여 확실하게 스크롤 처리
    const timer1 = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    const timer2 = setTimeout(() => {
      scrollToBottom();
    }, 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages, isTyping]);

  // Handler to refresh the current chat
  const handleRefreshChat = async () => {
    if (!currentChat) return;
    
    try {
      await loadChat(currentChat.id, true); // Force refresh from server
      console.log("Chat refreshed from server");
    } catch (error) {
      console.error("Failed to refresh chat:", error);
    }
  };

  // Helper function to detect error messages
  const isErrorMessage = (content) => {
    if (!content) return false;
    return content.startsWith('Error generating content:') || 
           content.startsWith('Error:') || 
           (typeof content === 'string' && content.toLowerCase().includes('error'));
  };

  // Find the last user message to retry
  const getLastUserMessage = () => {
    if (!Array.isArray(messages)) return null;
    
    // Find the last user message
    for (let i = messages.length - 2; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return messages[i].content;
      }
    }
    return null;
  };

  // Handle retry functionality
  const handleRetry = async (index) => {
    const lastUserMessage = getLastUserMessage();
    if (!lastUserMessage || !currentChat) return;
    
    // Remove the error message and any subsequent messages
    const chatId = currentChat.id;
    // This will be handled in the retryMessage function in ChatContext
    try {
      await sendChatMessage(chatId, lastUserMessage, true);
    } catch (error) {
      console.error("Failed to retry message:", error);
    }
  };

  // 시스템 메시지를 제외한 메시지만 표시
  const filteredMessages = Array.isArray(messages) 
    ? messages.filter(message => message.role !== 'system')
    : [];

  if (!filteredMessages || filteredMessages.length === 0) {
    return (
      <div className="empty-messages">
        <p>No messages yet. Start typing to begin a conversation.</p>
      </div>
    );
  }

  // Check for messages being processed for a long time
  const hasLongRunningMessage = isTyping && filteredMessages.length > 0;

  return (
    <div className="message-list" ref={messageListRef}>
      {filteredMessages.map((message, index) => {
        const hasError = message.role === 'assistant' && isErrorMessage(message.content);
        
        return (
          <div 
            key={message.id || `msg-${index}`}
            className={`message message-${message.role} ${hasError ? 'message-error' : ''}`}
          >
            <div className="message-header">
              {message.role === 'user' ? 'You' : 
               message.role === 'assistant' ? 'AI' : 'System'}
            </div>
            <div className="message-content">
              {message.content}
              {hasError && (
                <div className="error-actions">
                  <button 
                    className="retry-button"
                    onClick={() => handleRetry(index)}
                  >
                    Retry message
                  </button>
                </div>
              )}
            </div>
            <div className="message-timestamp">
              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'Just now'}
            </div>
          </div>
        );
      })}
      
      {isTyping && <TypingIndicator />}
      
      {hasLongRunningMessage && (
        <div className="message-list-actions">
          <button 
            className="refresh-button"
            onClick={handleRefreshChat}
            title="Messages may take a while to generate. Click to check for updates."
          >
            Check for new messages
          </button>
        </div>
      )}
      
      <div ref={messagesEndRef} style={{float: "left", clear: "both", height: "5px", width: "100%", marginTop: "20px", marginBottom: "20px"}} />
    </div>
  );
};

export default MessageList;