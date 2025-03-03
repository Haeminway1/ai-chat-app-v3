import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import './ChatPage.css';

const SystemMessage = ({ chat, modelConfig, systemPrompts, onUpdateSystemMessage }) => {
  const [editing, setEditing] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');
  const [selectedPromptKey, setSelectedPromptKey] = useState('default_system');
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    // Find system message
    if (!chat || !chat.messages) return;
    
    const sysMsg = chat.messages.find(msg => msg.role === 'system');
    if (sysMsg) {
      setSystemMessage(sysMsg.content);
      
      // Try to determine which prompt key matches this content
      const promptKey = Object.entries(systemPrompts || {}).find(
        ([key, content]) => content === sysMsg.content
      )?.[0] || 'default_system';
      
      setSelectedPromptKey(promptKey);
    } else {
      setSystemMessage('');
      setSelectedPromptKey('default_system');
    }
  }, [chat, systemPrompts]);
  
  const handleSaveSystem = () => {
    onUpdateSystemMessage(systemMessage);
    setEditing(false);
  };
  
  const handleSelectPrompt = (e) => {
    const key = e.target.value;
    setSelectedPromptKey(key);
    setSystemMessage(systemPrompts[key] || '');
  };
  
  if (!chat || !modelConfig) {
    return null;
  }
  
  const supportsSystemPrompt = modelConfig?.supports_system_prompt !== false;
  
  if (!supportsSystemPrompt) {
    return (
      <div className="system-message-container">
        <div className="system-message-header">
          <h3>System Message</h3>
        </div>
        <div className="system-message-placeholder">
          The selected model ({chat.model}) does not support system messages.
        </div>
      </div>
    );
  }
  
  return (
    <div className={`system-message-container ${collapsed ? 'collapsed' : ''}`}>
      <div className="system-message-header">
        <h3>System Message</h3>
        <div className="system-message-controls">
          <button 
            className="system-message-toggle"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button 
            className="system-message-collapse"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>
      
      {!collapsed && (
        <div className="system-message-content">
          {editing ? (
            <>
              <div className="model-parameter">
                <label>Prompt Template:</label>
                <select value={selectedPromptKey} onChange={handleSelectPrompt}>
                  {Object.keys(systemPrompts || {}).map(key => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
              
              <textarea
                className="system-message-input"
                value={systemMessage}
                onChange={(e) => setSystemMessage(e.target.value)}
                placeholder="Enter a system message to set the behavior of the AI..."
              />
              
              <div className="system-message-actions">
                <button 
                  className="secondary-button"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  className="primary-button"
                  onClick={handleSaveSystem}
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <div className="system-message-display">
              {systemMessage || (
                <span className="system-message-placeholder">
                  No system message set. Click "Edit" to add one.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentChat, 
    loadChat, 
    createNewChat, 
    sendChatMessage,
    updateSystemMessage,
    updateChatTitle,
    loading,
    lastLoadedChatId
  } = useChat();
  const { modelConfigs } = useModel();
  const { systemPrompts } = useSettings();

  // State for chat title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadTried, setLoadTried] = useState(false);
  
  // Ref to track if we need to create a new chat
  const shouldCreateChat = useRef(false);

  // Effect to handle chat loading or creation
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
                shouldCreateChat.current = true;
              }
            })
            .catch(() => {
              setLoadFailed(true);
              shouldCreateChat.current = true;
            });
        }
      } else if (location.pathname === '/chat') {
        // Only create a new chat when specifically navigating to base /chat path
        shouldCreateChat.current = true;
      }
    }
  }, [chatId, loadChat, loadTried, location.pathname, currentChat, lastLoadedChatId]);

  // Handle creating a new chat if needed
  useEffect(() => {
    if (shouldCreateChat.current && !currentChat && !loading) {
      shouldCreateChat.current = false;
      createNewChat("New Chat").then(newChat => {
        if (newChat) {
          navigate(`/chat/${newChat.id}`, { replace: true });
        }
      });
    }
  }, [createNewChat, currentChat, navigate, loading]);

  // Update title state when chat changes
  useEffect(() => {
    if (currentChat) {
      setNewTitle(currentChat.title);
    }
  }, [currentChat]);

  // Check if chat ID change requires a new load
  useEffect(() => {
    if (chatId && lastLoadedChatId !== chatId && currentChat?.id !== chatId) {
      loadChat(chatId);
    }
  }, [chatId, lastLoadedChatId, currentChat, loadChat]);

  const handleSendMessage = async (content) => {
    if (!chatId || !currentChat) return;
    
    await sendChatMessage(chatId, content);
  };
  
  const handleUpdateSystemMessage = async (content) => {
    if (!chatId || !currentChat) return;
    
    await updateSystemMessage(chatId, content);
  };

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (currentChat && newTitle.trim()) {
      await updateChatTitle(currentChat.id, newTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setNewTitle(currentChat?.title || '');
    }
  };

  const handleSettingsClick = () => {
    navigate('/settings', { state: { from: location.pathname } });
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
          onClick={async () => {
            const newChat = await createNewChat("New Chat");
            if (newChat) {
              navigate(`/chat/${newChat.id}`, { replace: true });
            }
          }}
        >
          Create New Chat
        </button>
      </div>
    );
  }

  // If no chat is selected, prompt to create one
  if (!chatId && !currentChat) {
    return (
      <div className="no-chat-selected">
        <p>Select a chat or create a new one to start.</p>
        <button 
          className="primary-button"
          onClick={async () => {
            const newChat = await createNewChat("New Chat");
            if (newChat) {
              navigate(`/chat/${newChat.id}`, { replace: true });
            }
          }}
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
      <button 
        className="settings-button global-settings-button"
        onClick={handleSettingsClick}
        title="Settings"
      >
        <span className="icon">⚙️</span>
      </button>
      
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">
            {isEditingTitle ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="chat-title-input"
              />
            ) : (
              <h2 onClick={handleStartEditTitle}>{currentChat.title}</h2>
            )}
          </div>
          <div className="chat-model-info">
            <span>{currentChat.model}</span>
          </div>
        </div>
        
        <SystemMessage 
          chat={currentChat} 
          modelConfig={modelConfig}
          systemPrompts={systemPrompts}
          onUpdateSystemMessage={handleUpdateSystemMessage}
        />
        
        <div className="messages-container">
          <MessageList 
            messages={currentChat.messages.filter(msg => msg.role !== 'system')} 
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
