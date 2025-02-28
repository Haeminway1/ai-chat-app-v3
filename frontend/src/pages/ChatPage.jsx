import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  
  useEffect(() => {
    // Find system message
    const sysMsg = chat.messages.find(msg => msg.role === 'system');
    if (sysMsg) {
      setSystemMessage(sysMsg.content);
      
      // Try to determine which prompt key matches this content
      const promptKey = Object.entries(systemPrompts).find(
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
    <div className="system-message-container">
      <div className="system-message-header">
        <h3>System Message</h3>
        <button 
          className="system-message-toggle"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      
      {editing ? (
        <div className="system-message-content">
          <div className="model-parameter">
            <label>Prompt Template:</label>
            <select value={selectedPromptKey} onChange={handleSelectPrompt}>
              {Object.keys(systemPrompts).map(key => (
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
        </div>
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
  );
};

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
    sending 
  } = useChat();
  const { modelConfigs, currentModel, switchModel } = useModel();
  const { systemPrompts } = useSettings();

  // Track if the chat's model differs from the selected model
  const [modelMismatch, setModelMismatch] = useState(false);
  // State for chat title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    } else if (!currentChat) {
      // Create a new chat if no chat is selected
      createNewChat("New Chat").then(newChat => {
        if (newChat) {
          navigate(`/chat/${newChat.id}`);
        }
      });
    }
  }, [chatId]);

  // Update title state when chat changes
  useEffect(() => {
    if (currentChat) {
      setNewTitle(currentChat.title);
    }
  }, [currentChat]);

  // Check for model mismatch whenever currentChat or currentModel changes
  useEffect(() => {
    if (currentChat && currentModel && currentChat.model !== currentModel) {
      setModelMismatch(true);
    } else {
      setModelMismatch(false);
    }
  }, [currentChat, currentModel]);

  const handleSendMessage = async (content) => {
    if (!chatId) return;
    
    await sendChatMessage(chatId, content);
  };
  
  const handleUpdateSystemMessage = async (content) => {
    if (!chatId) return;
    
    await updateSystemMessage(chatId, content);
  };

  const handleSwitchChatModel = async () => {
    if (!currentChat || !currentModel) return;
    
    try {
      // Create a new chat with the current model
      const newChat = await createNewChat(
        "New Chat", 
        null, 
        currentModel
      );
      
      if (newChat) {
        navigate(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Failed to switch chat model:', error);
    }
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
      setNewTitle(currentChat.title);
    }
  };

  if (!currentChat && chatId) {
    return (
      <div className="chat-loading">
        <p>Loading chat...</p>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="no-chat-selected">
        <p>Select a chat or create a new one to start.</p>
        <button 
          className="primary-button"
          onClick={async () => {
            const newChat = await createNewChat("New Chat");
            if (newChat) {
              navigate(`/chat/${newChat.id}`);
            }
          }}
        >
          New Chat
        </button>
      </div>
    );
  }

  const modelConfig = modelConfigs[currentChat.model] || {};

  return (
    <div className="chat-page">
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
            <span>Model: {currentChat.model}</span>
            {modelMismatch && (
              <button 
                className="model-mismatch-button" 
                onClick={handleSwitchChatModel}
                title="The selected model is different from this chat's model"
              >
                Switch to {currentModel}
              </button>
            )}
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
          disabled={sending}
        />
      </div>
    </div>
  );
};

export default ChatPage;