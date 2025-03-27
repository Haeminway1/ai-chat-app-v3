import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './MessageInput.css';

const MessageInput = ({ chatId, onSend }) => {
  const [message, setMessage] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const textareaRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const { sendChatMessage, isTyping } = useChat();
  
  // Handle custom resize functionality with top handle
  useEffect(() => {
    const handleMouseDown = (e) => {
      // Check if the resize handle exists and was clicked
      if (!resizeHandleRef.current || !textareaRef.current) return;
      
      // Check if the click target is the resize handle
      if (resizeHandleRef.current.contains(e.target)) {
        setIsResizing(true);
        setStartY(e.clientY);
        setStartHeight(textareaRef.current.offsetHeight);
        e.preventDefault(); // Prevent text selection during resize
      }
    };
    
    const handleMouseMove = (e) => {
      if (!isResizing || !textareaRef.current) return;
      
      // Calculate new height - drag up to increase height
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(150, Math.min(500, startHeight - deltaY));
      
      textareaRef.current.style.height = `${newHeight}px`;
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startY, startHeight]);
  
  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set new height based on scrollHeight (min 150px)
      const newHeight = Math.max(150, textareaRef.current.scrollHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId) return;
    
    const trimmedMessage = message.trim();
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '150px';
    }
    
    await sendChatMessage(chatId, trimmedMessage);
    
    // Callback after sending
    if (onSend) {
      onSend();
    }
  };

  return (
    <div className="message-input-container">
      {/* Resize handle at the top of the textarea */}
      <div 
        className="resize-handle" 
        ref={resizeHandleRef}
        title="Drag to resize"
      />
      
      <div className="message-input-wrapper">
        <textarea
          ref={textareaRef}
          className="message-input"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isTyping}
        />
      </div>
      <button
        className="send-button"
        onClick={handleSendMessage}
        disabled={!message.trim() || isTyping}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default MessageInput;