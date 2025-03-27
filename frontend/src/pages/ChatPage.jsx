import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useChatScrollManager } from '../hooks/useChatScrollManager';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import ChatHeader from '../components/chat/ChatHeader';
import SystemMessageEditor from '../components/chat/SystemMessageEditor';
import './ChatPage.css';

// Store scroll positions by chat ID
const chatScrollPositions = {};

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { 
    currentChat, 
    loadChat, 
    createNewChat, 
    updateChatName,
    loading 
  } = useChat();
  
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadTried, setLoadTried] = useState(false);
  const messagesContainerRef = useRef(null);
  
  // Custom hook to manage chat scrolling
  const { handleScroll, isNearBottom, scrollToBottom } = useChatScrollManager({
    containerRef: messagesContainerRef,
    messages: currentChat?.messages || []
  });
  
  // Effect to handle chat loading - only load existing chats, don't auto-create
  useEffect(() => {
    // Only handle initial navigation once
    if (!loadTried) {
      setLoadTried(true);
      
      if (chatId) {
        // Try to load an existing chat
        loadChat(chatId)
          .then(result => {
            if (!result) {
              setLoadFailed(true);
            }
          })
          .catch(() => {
            setLoadFailed(true);
          });
      }
    }
  }, [chatId, loadChat, loadTried]);

  // Save scroll position when unmounting or changing chats
  useEffect(() => {
    return () => {
      if (chatId && messagesContainerRef.current) {
        chatScrollPositions[chatId] = messagesContainerRef.current.scrollTop;
      }
    };
  }, [chatId]);
  
  // Restore scroll position when a chat is loaded
  useEffect(() => {
    if (chatId && messagesContainerRef.current && currentChat) {
      setTimeout(() => {
        const savedPosition = chatScrollPositions[chatId];
        if (savedPosition !== undefined) {
          messagesContainerRef.current.scrollTop = savedPosition;
        } else {
          // If no saved position, scroll to bottom (for new chats)
          scrollToBottom();
        }
      }, 100);
    }
  }, [chatId, currentChat, scrollToBottom]);

  // Scroll handling for new messages
  useEffect(() => {
    if (isNearBottom && currentChat?.messages?.length > 0) {
      scrollToBottom();
    }
  }, [currentChat?.messages?.length, isNearBottom, scrollToBottom]);

  // Handle creation of a new chat
  const handleCreateNewChat = () => {
    createNewChat("New Chat").then(newChat => {
      if (newChat) {
        navigate(`/chat/${newChat.id}`, { replace: true });
      }
    });
  };

  const handleUpdateChatTitle = async (newTitle) => {
    if (currentChat) {
      await updateChatName(currentChat.id, newTitle);
    }
  };

  // Show loading state if trying to load a chat
  if (loading && chatId && !currentChat) {
    return (
      <div className="chat-loading">
        <div className="spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  // Show error if load failed
  if (loadFailed && !currentChat) {
    return (
      <div className="chat-loading">
        <p>Failed to load the chat. The chat may have been deleted or doesn't exist.</p>
        <button 
          className="primary-button"
          onClick={handleCreateNewChat}
        >
          Create New Chat
        </button>
      </div>
    );
  }

  // If no chat is selected, show welcome screen
  if (!chatId && !currentChat) {
    return (
      <div className="no-chat-selected">
        <p>Select a chat or create a new one to start.</p>
        <button 
          className="primary-button"
          onClick={handleCreateNewChat}
        >
          New Chat
        </button>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="chat-loading">
        <div className="spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Spacer to prevent content overlap with navigation */}
      <div className="header-spacer"></div>
      
      <div className="chat-container">
        <ChatHeader 
          chat={currentChat} 
          onTitleChange={handleUpdateChatTitle}
        />
        
        <SystemMessageEditor 
          chatId={currentChat.id}
          initialMessage={currentChat.systemMessage || ''}
        />
        
        <div 
          className="messages-container"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          <MessageList 
            messages={currentChat.messages || []} 
            chatId={currentChat.id}
          />
        </div>
        
        <MessageInput chatId={currentChat.id} onSend={scrollToBottom} />
      </div>
    </div>
  );
};

export default ChatPage;