import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import SystemMessageEditor from '../components/chat/SystemMessageEditor';
import ChatHeader from '../components/chat/ChatHeader';
import './ChatPage.css';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { 
    currentChat, 
    loadChat, 
    createNewChat, 
    sendChatMessage,
    updateSystemMessage,
    updateChatTitle,
    loading,
    lastLoadedChatId,
    isTyping
  } = useChat();
  const { modelConfigs } = useModel();
  const { systemPrompts } = useSettings();

  const [loadFailed, setLoadFailed] = useState(false);
  const [loadTried, setLoadTried] = useState(false);
  
  // Effect to handle chat loading - only load existing chats, don't auto-create
  useEffect(() => {
    // Only handle initial navigation once
    if (!loadTried) {
      setLoadTried(true);
      
      if (chatId) {
        // Try to load an existing chat if chatId doesn't match last loaded
        if (!currentChat || chatId !== lastLoadedChatId) {
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
    }
  }, [chatId, loadChat, loadTried, currentChat, lastLoadedChatId]);

  // Handle chat creation manually
  const handleCreateNewChat = () => {
    createNewChat("New Chat").then(newChat => {
      if (newChat) {
        navigate(`/chat/${newChat.id}`, { replace: true });
      }
    });
  };

  const handleSendMessage = async (content) => {
    if (!chatId || !currentChat) return;
    
    await sendChatMessage(chatId, content);
  };
  
  const handleUpdateSystemMessage = async (content) => {
    if (!chatId || !currentChat) return;
    
    await updateSystemMessage(chatId, content);
  };

  const handleUpdateChatTitle = async (newTitle) => {
    if (currentChat) {
      await updateChatTitle(currentChat.id, newTitle);
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

  const modelConfig = modelConfigs[currentChat.model] || {};

  return (
    <div className="chat-page">
      <div className="chat-container">
        <ChatHeader 
          chat={currentChat} 
          onTitleChange={handleUpdateChatTitle} 
        />
        
        <SystemMessageEditor 
          chat={currentChat} 
          modelConfig={modelConfig}
          systemPrompts={systemPrompts}
          onUpdateSystemMessage={handleUpdateSystemMessage}
        />
        
        <div className="messages-container">
          <MessageList 
            messages={currentChat.messages.filter(msg => msg.role !== 'system')} 
            isTyping={isTyping}
          />
        </div>
        
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default ChatPage;