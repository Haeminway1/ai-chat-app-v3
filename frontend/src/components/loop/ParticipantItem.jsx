import React, { useState, useEffect } from 'react';
import { useModel } from '../../contexts/ModelContext';
import { useSettings } from '../../contexts/SettingsContext';
import './ParticipantItem.css';

const ParticipantItem = ({ participant, index, loopId, onUpdate, onRemove, onMoveUp, onMoveDown, systemPrompts }) => {
  const { modelConfigs } = useModel();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(participant.display_name);
  const [selectedModel, setSelectedModel] = useState(participant.model);
  const [selectedPrompt, setSelectedPrompt] = useState('custom');
  const [systemPrompt, setSystemPrompt] = useState(participant.system_prompt);
  
  // Add temperature and token settings
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [reasoningEffort, setReasoningEffort] = useState("medium");
  
  // Get initial parameter values from model config when a model is selected
  useEffect(() => {
    if (selectedModel && modelConfigs[selectedModel]) {
      const config = modelConfigs[selectedModel];
      setTemperature(config.temperature || 0.7);
      setMaxTokens(config.max_tokens || 4000);
      setReasoningEffort(config.reasoning_effort || "medium");
    }
  }, [selectedModel, modelConfigs]);
  
  // Determine which preset prompt is selected, if any
  useEffect(() => {
    if (participant.system_prompt) {
      const matchingPrompt = Object.entries(systemPrompts).find(
        ([key, prompt]) => prompt === participant.system_prompt
      );
      
      if (matchingPrompt) {
        setSelectedPrompt(matchingPrompt[0]);
      } else {
        setSelectedPrompt('custom');
      }
    } else {
      setSelectedPrompt('none');
    }
  }, [participant.system_prompt, systemPrompts]);
  
  // When a model is selected, check if it supports system prompts
  const supportsSystemPrompt = React.useMemo(() => {
    if (!selectedModel) return true;
    
    const modelConfig = modelConfigs[selectedModel];
    return modelConfig ? modelConfig.supports_system_prompt !== false : true;
  }, [selectedModel, modelConfigs]);
  
  // Check if it's an O3 model
  const isO3Model = React.useMemo(() => {
    if (!selectedModel || !modelConfigs[selectedModel]) return false;
    return modelConfigs[selectedModel].category === 'o3';
  }, [selectedModel, modelConfigs]);
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleNameUpdate = () => {
    if (name !== participant.display_name) {
      onUpdate(participant.id, { display_name: name });
    }
    setIsEditingName(false);
  };
  
  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameUpdate();
    } else if (e.key === 'Escape') {
      setName(participant.display_name);
      setIsEditingName(false);
    }
  };
  
  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    
    // Update model and reset parameters to default for that model
    if (modelConfigs[newModel]) {
      const config = modelConfigs[newModel];
      const updates = { 
        model: newModel,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 4000
      };
      
      // Add reasoning_effort for O3 models
      if (config.category === 'o3') {
        updates.reasoning_effort = config.reasoning_effort || "medium";
      }
      
      onUpdate(participant.id, updates);
    } else {
      onUpdate(participant.id, { model: newModel });
    }
  };
  
  const handlePromptTypeChange = (e) => {
    const promptKey = e.target.value;
    setSelectedPrompt(promptKey);
    
    if (promptKey === 'none') {
      setSystemPrompt('');
      onUpdate(participant.id, { system_prompt: '' });
    } else if (promptKey !== 'custom' && systemPrompts[promptKey]) {
      setSystemPrompt(systemPrompts[promptKey]);
      onUpdate(participant.id, { system_prompt: systemPrompts[promptKey] });
    }
  };
  
  const handleCustomPromptChange = (e) => {
    setSystemPrompt(e.target.value);
  };
  
  const handleCustomPromptSave = () => {
    onUpdate(participant.id, { system_prompt: systemPrompt });
  };
  
  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove this participant?`)) {
      onRemove(participant.id);
    }
  };
  
  // New handlers for temperature, tokens, and reasoning effort
  const handleTemperatureChange = (e) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);
    onUpdate(participant.id, { temperature: newTemp });
  };
  
  const handleMaxTokensChange = (e) => {
    const newTokens = parseInt(e.target.value);
    setMaxTokens(newTokens);
    onUpdate(participant.id, { max_tokens: newTokens });
  };
  
  const handleReasoningEffortChange = (e) => {
    const newEffort = e.target.value;
    setReasoningEffort(newEffort);
    onUpdate(participant.id, { reasoning_effort: newEffort });
  };
  
  // Sort all available models by provider and category
  const getModelOptions = () => {
    const options = [];
    
    // Group models by provider and category
    const groupedModels = {};
    
    Object.keys(modelConfigs).forEach(modelKey => {
      const config = modelConfigs[modelKey];
      const provider = config.provider || 'unknown';
      const category = config.category || 'other';
      
      if (!groupedModels[provider]) {
        groupedModels[provider] = {};
      }
      
      if (!groupedModels[provider][category]) {
        groupedModels[provider][category] = [];
      }
      
      groupedModels[provider][category].push(modelKey);
    });
    
    // Convert to option groups
    Object.entries(groupedModels).forEach(([provider, categories]) => {
      Object.entries(categories).forEach(([category, models]) => {
        const groupLabel = `${getProviderName(provider)} - ${getCategoryName(category)}`;
        
        options.push(
          <optgroup key={`${provider}-${category}`} label={groupLabel}>
            {models.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </optgroup>
        );
      });
    });
    
    return options;
  };
  
  const getProviderName = (provider) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'anthropic': return 'Anthropic';
      case 'google': return 'Google';
      case 'xai': return 'xAI';
      default: return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };
  
  const getCategoryName = (category) => {
    switch (category) {
      case 'gpt': return 'GPT';
      case 'claude': return 'Claude';
      case 'gemini': return 'Gemini';
      case 'o3': return 'o3 Models';
      case 'grok': return 'Grok';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };
  
  return (
    <div className={`participant-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="participant-header">
        <div className="participant-reorder">
          <button 
            className="move-button"
            onClick={onMoveUp}
            title="Move up"
            disabled={index === 0}
          >
            ▲
          </button>
          <button 
            className="move-button"
            onClick={onMoveDown}
            title="Move down"
          >
            ▼
          </button>
        </div>
        
        <div className="participant-index">{index + 1}</div>
        
        <div className="participant-name">
          {isEditingName ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameUpdate}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className="participant-name-input"
            />
          ) : (
            <span onClick={() => setIsEditingName(true)}>
              {participant.display_name}
            </span>
          )}
        </div>
        
        <div className="participant-model-label">
          {selectedModel}
        </div>
        
        <div className="participant-actions">
          <button 
            className="participant-toggle-button"
            onClick={handleToggleExpand}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "▲" : "▼"}
          </button>
          <button 
            className="participant-remove-button"
            onClick={handleRemove}
            title="Remove participant"
          >
            ×
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="participant-details">
          <div className="participant-model-select">
            <label>Model:</label>
            <select value={selectedModel} onChange={handleModelChange}>
              {getModelOptions()}
            </select>
          </div>
          
          {/* Model Parameters Section (Part 1 in the image) */}
          <div className="model-parameters-section">
            <h4>Model Parameters</h4>
            
            {/* Temperature slider (non-O3 models only) */}
            {!isO3Model && (
              <div className="parameter-item">
                <label>
                  Temperature: <span className="parameter-value">{temperature}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={temperature}
                  onChange={handleTemperatureChange}
                />
                <div className="parameter-description">
                  Controls creativity. Lower values are more deterministic, higher values more creative.
                </div>
              </div>
            )}
            
            {/* Max Tokens input */}
            <div className="parameter-item">
              <label>Max Tokens</label>
              <input 
                type="number" 
                min="1" 
                max="100000" 
                value={maxTokens}
                onChange={handleMaxTokensChange}
              />
              <div className="parameter-description">
                Maximum number of tokens in the response.
              </div>
            </div>
            
            {/* Reasoning Effort dropdown (O3 models only) */}
            {isO3Model && (
              <div className="parameter-item">
                <label>Reasoning Effort</label>
                <select
                  value={reasoningEffort}
                  onChange={handleReasoningEffortChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <div className="parameter-description">
                  Controls how much effort the model spends on reasoning.
                </div>
              </div>
            )}
          </div>
          
          {/* System Prompt Section (Part 2 in the image) */}
          {supportsSystemPrompt ? (
            <div className="participant-system-prompt">
              <div className="system-prompt-select">
                <label>System Prompt:</label>
                <select value={selectedPrompt} onChange={handlePromptTypeChange}>
                  <option value="none">None</option>
                  <option value="custom">Custom</option>
                  {Object.keys(systemPrompts).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              
              {/* Custom prompt editor (always visible) */}
              <div className="custom-prompt-editor">
                <textarea
                  value={systemPrompt}
                  onChange={handleCustomPromptChange}
                  onBlur={handleCustomPromptSave}
                  placeholder="Enter a custom system prompt for this participant..."
                  rows={4}
                  disabled={selectedPrompt !== 'custom' && selectedPrompt !== 'none'}
                />
                <div className="prompt-editor-help">
                  {selectedPrompt !== 'custom' ? 'Using preset prompt. Switch to "Custom" to edit.' : 'Enter custom instructions for this AI participant.'}
                </div>
              </div>
              
              {selectedPrompt !== 'none' && selectedPrompt !== 'custom' && (
                <div className="prompt-preview">
                  <div className="prompt-preview-label">Selected prompt preview:</div>
                  <div className="prompt-preview-content">{systemPrompts[selectedPrompt]}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="system-prompt-notice">
              Note: {selectedModel} does not support system prompts. Any prompt will be prepended to the first message.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantItem;