import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useModel } from '../contexts/ModelContext';
import ChatList from './chat/ChatList';
import './Sidebar.css';

const ModelParameters = ({ currentModel, modelConfig, onUpdateParameters }) => {
  const [temperature, setTemperature] = useState(modelConfig?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(modelConfig?.max_tokens || 4000);
  
  const handleSave = () => {
    onUpdateParameters(currentModel, {
      temperature: parseFloat(temperature),
      max_tokens: parseInt(maxTokens)
    });
  };
  
  return (
    <div className="model-parameters">
      <h3>Model Parameters</h3>
      
      <div className="model-parameter">
        <label>Temperature</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
        />
        <span>{temperature}</span>
      </div>
      
      <div className="model-parameter">
        <label>Max Tokens</label>
        <input 
          type="number" 
          min="1" 
          max="100000" 
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
        />
      </div>
      
      <button className="primary-button" onClick={handleSave}>Save Parameters</button>
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { createNewChat } = useChat();
  const { currentModel, modelConfigs, updateParameters } = useModel();
  const [collapsed, setCollapsed] = useState(false);
  const [showParams, setShowParams] = useState(false);

  const handleNewChat = async () => {
    const newChat = await createNewChat();
    if (newChat) {
      navigate(`/chat/${newChat.id}`);
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleParams = () => {
    setShowParams(!showParams);
  };

  const handleUpdateParameters = async (modelName, params) => {
    await updateParameters(modelName, params);
  };

  return (
    <>
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && <h2>AI Chat App</h2>}
          <button className="toggle-sidebar" onClick={toggleSidebar}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        
        {!collapsed && (
          <button 
            className="new-chat-button primary-button"
            onClick={handleNewChat}
          >
            New Chat
          </button>
        )}
        
        <div className="chats-container">
          <ChatList />
        </div>
        
        <div className="sidebar-footer">
          <button
            className="settings-button outline-button"
            onClick={() => navigate('/settings')}
          >
            {collapsed ? '⚙️' : <span>Settings</span>}
          </button>
          <button
            className="api-keys-button outline-button"
            onClick={() => navigate('/api-keys')}
          >
            {collapsed ? '🔑' : <span>API Keys</span>}
          </button>
        </div>
      </div>
      
      <div className={`model-params-container ${showParams ? 'open' : ''}`}>
        <button className="params-toggle" onClick={toggleParams}>
          {showParams ? 'Hide Parameters' : 'Model Parameters'}
        </button>
        {showParams && (
          <ModelParameters 
            currentModel={currentModel} 
            modelConfig={modelConfigs[currentModel]}
            onUpdateParameters={handleUpdateParameters}
          />
        )}
      </div>
    </>
  );
};

export default Sidebar;