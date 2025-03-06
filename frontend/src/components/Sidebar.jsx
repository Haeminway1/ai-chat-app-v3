import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useLoop } from '../contexts/LoopContext';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import ChatList from './chat/ChatList';
import LoopList from './loop/LoopList';
import './Sidebar.css';

const ModelParameters = ({ currentModel, modelConfig, onUpdateParameters, onSwitchModel }) => {
  const { jsonMode, toggleJsonMode } = useSettings();
  const [temperature, setTemperature] = useState(modelConfig?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(modelConfig?.max_tokens || 4000);
  const [reasoningEffort, setReasoningEffort] = useState(modelConfig?.reasoning_effort || "medium");
  
  const { 
    getAllProviders,
    getModelsByProvider 
  } = useModel();
  
  const isO3Model = modelConfig?.category === 'o3';
  
  // Get all providers and models
  const providers = getAllProviders();
  
  const handleModelChange = (e) => {
    onSwitchModel(e.target.value);
  };
  
  const getProviderName = (provider) => {
    if (provider === 'openai') return 'OpenAI';
    if (provider === 'anthropic') return 'Anthropic';
    if (provider === 'google') return 'Google';
    return provider;
  };

  const getCategoryName = (category) => {
    return category.toUpperCase();
  };
  
  const handleSave = () => {
    const params = {
      max_tokens: parseInt(maxTokens)
    };
    
    if (!isO3Model) {
      params.temperature = parseFloat(temperature);
    }
    
    if (isO3Model) {
      params.reasoning_effort = reasoningEffort;
    }
    
    onUpdateParameters(currentModel, params);
  };
  
  return (
    <div className="model-parameters">
      <h3>Model Parameters</h3>
      
      <div className="model-parameter model-selector">
        <label>Model</label>
        <select value={currentModel || ''} onChange={handleModelChange}>
          {providers.map(provider => {
            const modelsByCategory = getModelsByProvider(provider);
            return Object.entries(modelsByCategory).map(([category, models]) => (
              <optgroup key={`${provider}-${category}`} 
                label={`${getProviderName(provider)} - ${getCategoryName(category)}`}>
                {models.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </optgroup>
            ));
          })}
        </select>
      </div>
      
      {!isO3Model && (
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
      )}
      
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
      
      {isO3Model && (
        <div className="model-parameter">
          <label>Reasoning Effort</label>
          <select
            value={reasoningEffort}
            onChange={(e) => setReasoningEffort(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      )}
      
      <div className="json-mode-toggle">
        <label>
          <input 
            type="checkbox" 
            checked={jsonMode} 
            onChange={() => toggleJsonMode(!jsonMode)} 
          />
          JSON Mode
        </label>
      </div>
      
      <button className="primary-button" onClick={handleSave}>Save Parameters</button>
    </div>
  );
};

const Sidebar = ({ onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[1]; // Gets 'chat' or 'loop' from path
  const { createNewChat, updateChatModel } = useChat();
  const { createNewLoop } = useLoop();
  const { currentModel, modelConfigs, updateParameters, switchModel } = useModel();
  const [collapsed, setCollapsed] = useState(false);
  const [showParams, setShowParams] = useState(false);

  const handleNewChat = async () => {
    const newChat = await createNewChat("New Chat");
    if (newChat) {
      navigate(`/chat/${newChat.id}`);
    }
  };
  
  const handleNewLoop = async () => {
    const newLoop = await createNewLoop("New Loop");
    if (newLoop) {
      navigate(`/loop/${newLoop.id}`);
    }
  };

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    
    if (onToggle) {
      onToggle(newCollapsedState);
    }
    
    // Hide params panel when sidebar is collapsed
    if (newCollapsedState && showParams) {
      setShowParams(false);
    }
  };

  const handleUpdateParameters = async (modelName, params) => {
    await updateParameters(modelName, params);
  };
  
  const handleSwitchModel = async (modelType) => {
    await switchModel(modelType);
    
    // Update current chat model if on a chat page
    if (location.pathname.includes('/chat/')) {
      const chatId = location.pathname.split('/chat/')[1];
      if (chatId) {
        await updateChatModel(chatId, modelType);
      }
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>AI Chat App</h2>}
        <button className="toggle-sidebar" onClick={toggleSidebar}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      
      {!collapsed && (
        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${currentView === 'chat' ? 'active' : ''}`}
            onClick={() => navigate('/chat')}
          >
            Chats
          </button>
          <button 
            className={`sidebar-tab ${currentView === 'loop' ? 'active' : ''}`}
            onClick={() => navigate('/loop')}
          >
            Loops
          </button>
        </div>
      )}
      
      {!collapsed && (
        <button 
          className="new-chat-button primary-button"
          onClick={currentView === 'loop' ? handleNewLoop : handleNewChat}
        >
          {currentView === 'loop' ? 'New Loop' : 'New Chat'}
        </button>
      )}
      
      <div className="sidebar-controls">
        {!collapsed && (
          <button 
            className={`params-toggle ${showParams ? 'active' : ''}`}
            onClick={() => setShowParams(!showParams)}
          >
            {showParams ? 'Hide Parameters' : 'Model Parameters'}
          </button>
        )}

        {showParams && !collapsed && currentModel && modelConfigs[currentModel] && (
          <div className="model-params-panel">
            <ModelParameters 
              currentModel={currentModel} 
              modelConfig={modelConfigs[currentModel]}
              onUpdateParameters={handleUpdateParameters}
              onSwitchModel={handleSwitchModel}
            />
          </div>
        )}
      </div>
      
      <div className="chats-container">
        {currentView === 'loop' ? <LoopList /> : <ChatList />}
      </div>
    </div>
  );
};

export default Sidebar;