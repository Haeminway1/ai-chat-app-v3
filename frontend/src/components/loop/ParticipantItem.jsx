import React, { useState, useEffect, useRef } from 'react';
import { useModel } from '../../contexts/ModelContext';
import { useSettings } from '../../contexts/SettingsContext';
import './ParticipantItem.css';

const ParticipantItem = ({ participant, index, isFirst, isLast, onUpdate, onRemove, onMoveUp, onMoveDown, isEditable, totalParticipants }) => {
  const { modelConfigs } = useModel();
  const { systemPrompts } = useSettings();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(participant?.display_name || '');
  const [selectedModel, setSelectedModel] = useState(participant?.model || '');
  const [selectedPrompt, setSelectedPrompt] = useState('custom');
  const [systemPrompt, setSystemPrompt] = useState(participant?.system_prompt || '');
  const [userPrompt, setUserPrompt] = useState(participant?.user_prompt || '');
  
  // Textarea ref for cursor position
  const userPromptRef = useRef(null);
  
  // Add temperature and token settings
  const [temperature, setTemperature] = useState(participant?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(participant?.max_tokens || 4000);
  const [reasoningEffort, setReasoningEffort] = useState(participant?.reasoning_effort || "medium");
  
  // Get initial parameter values from model config when a model is selected
  useEffect(() => {
    if (selectedModel && modelConfigs && modelConfigs[selectedModel]) {
      const config = modelConfigs[selectedModel];
      setTemperature(config.temperature || 0.7);
      setMaxTokens(config.max_tokens || 4000);
      setReasoningEffort(config.reasoning_effort || "medium");
    }
  }, [selectedModel, modelConfigs]);
  
  // Determine which preset prompt is selected, if any
  useEffect(() => {
    if (participant?.system_prompt && systemPrompts) {
      // Make sure systemPrompts is defined before calling Object.entries
      const matchingPrompt = Object.entries(systemPrompts || {}).find(
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
  }, [participant?.system_prompt, systemPrompts]);
  
  // When a model is selected, check if it supports system prompts
  const supportsSystemPrompt = React.useMemo(() => {
    if (!selectedModel) return true;
    
    // O3 models don't support system prompts
    if (selectedModel.startsWith('o3-')) {
      return false;
    }
    
    const modelConfig = modelConfigs?.[selectedModel];
    return modelConfig ? modelConfig.supports_system_prompt !== false : true;
  }, [selectedModel, modelConfigs]);
  
  // Check if it's an O3 model
  const isO3Model = React.useMemo(() => {
    if (!selectedModel) return false;
    return selectedModel.startsWith('o3-');
  }, [selectedModel]);
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleNameUpdate = () => {
    if (name !== participant?.display_name) {
      onUpdate({ ...participant, display_name: name });
    }
    setIsEditingName(false);
  };
  
  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameUpdate();
    } else if (e.key === 'Escape') {
      setName(participant?.display_name || '');
      setIsEditingName(false);
    }
  };
  
  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    
    // Update model and reset parameters to default for that model
    if (modelConfigs && modelConfigs[newModel]) {
      const config = modelConfigs[newModel];
      const updates = { 
        ...participant,
        model: newModel,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 4000
      };
      
      // Add reasoning_effort for O3 models
      if (newModel.startsWith('o3-')) {
        updates.reasoning_effort = config.reasoning_effort || "medium";
      }
      
      onUpdate(updates);
    } else {
      onUpdate({ ...participant, model: newModel });
    }
  };
  
  const handlePromptTypeChange = (e) => {
    const promptKey = e.target.value;
    setSelectedPrompt(promptKey);
    
    if (promptKey === 'none') {
      setSystemPrompt('');
      onUpdate({ ...participant, system_prompt: '' });
    } else if (promptKey !== 'custom' && systemPrompts && systemPrompts[promptKey]) {
      setSystemPrompt(systemPrompts[promptKey]);
      onUpdate({ ...participant, system_prompt: systemPrompts[promptKey] });
    }
  };
  
  const handleCustomPromptChange = (e) => {
    setSystemPrompt(e.target.value);
  };
  
  const handleCustomPromptSave = () => {
    onUpdate({ ...participant, system_prompt: systemPrompt });
  };
  
  const handleUserPromptChange = (e) => {
    setUserPrompt(e.target.value);
  };
  
  const handleUserPromptSave = () => {
    onUpdate({ ...participant, user_prompt: userPrompt });
  };
  
  const handleAddPlaceholder = () => {
    const placeholder = "{prior_output}";
    // If already has placeholder, don't add again
    if (userPrompt.includes(placeholder)) return;
    
    // Add the placeholder at cursor position or at the end
    if (userPromptRef.current) {
      const cursorPos = userPromptRef.current.selectionStart;
      const textBefore = userPrompt.substring(0, cursorPos);
      const textAfter = userPrompt.substring(cursorPos);
      setUserPrompt(`${textBefore}${placeholder}${textAfter}`);
    } else {
      setUserPrompt(`${userPrompt}\n${placeholder}`);
    }
  };
  
  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove this participant?`)) {
      onRemove();
    }
  };
  
  // New handlers for temperature, tokens, and reasoning effort
  const handleTemperatureChange = (e) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);
    onUpdate({ ...participant, temperature: newTemp });
  };
  
  const handleMaxTokensChange = (e) => {
    const newTokens = parseInt(e.target.value);
    setMaxTokens(newTokens);
    onUpdate({ ...participant, max_tokens: newTokens });
  };
  
  const handleReasoningEffortChange = (e) => {
    const newEffort = e.target.value;
    setReasoningEffort(newEffort);
    onUpdate({ ...participant, reasoning_effort: newEffort });
  };
  
  // Sort all available models by provider and category
  const getModelOptions = () => {
    if (!modelConfigs) return [];
    
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
      <div className="participant-header" onClick={handleToggleExpand}>
        <div className="participant-order">{index + 1}</div>
        
        {isEditingName ? (
          <div className="participant-name-edit" onClick={e => e.stopPropagation()}>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleNameUpdate}
              onKeyDown={handleNameKeyDown}
              autoFocus
            />
          </div>
        ) : (
          <div className="participant-name" onDoubleClick={() => setIsEditingName(true)}>
            {participant?.display_name || `Participant ${index + 1}`}
          </div>
        )}
        
        <div className="participant-model">
          {participant?.model || 'No model'}
        </div>
        
        <div className="participant-controls">
          {!isFirst && (
            <button 
              className="move-up-button"
              onClick={e => { e.stopPropagation(); onMoveUp(); }}
              title="Move Up"
              disabled={!isEditable}
            >
              ↑
            </button>
          )}
          {!isLast && (
            <button 
              className="move-down-button"
              onClick={e => { e.stopPropagation(); onMoveDown(); }}
              title="Move Down"
              disabled={!isEditable}
            >
              ↓
            </button>
          )}
          <button 
            className="remove-button"
            onClick={e => { e.stopPropagation(); handleRemove(); }}
            title="Remove Participant"
            disabled={!isEditable || totalParticipants <= 1}
          >
            ×
          </button>
          <div className="expand-indicator">{isExpanded ? '▼' : '▶'}</div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="participant-details">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleNameUpdate}
              className="form-control"
              disabled={!isEditable}
            />
          </div>
          
          <div className="form-group">
            <label>Model</label>
            <select 
              value={selectedModel} 
              onChange={handleModelChange}
              className="form-control"
              disabled={!isEditable}
            >
              {getModelOptions()}
            </select>
          </div>
          
          <div className="form-group">
            <label>
              Temperature: <span className="param-value">{temperature.toFixed(1)}</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={temperature}
              onChange={handleTemperatureChange}
              className="form-control-range"
              disabled={!isEditable}
            />
          </div>
          
          <div className="form-group">
            <label>
              Max Tokens: <span className="param-value">{maxTokens}</span>
            </label>
            <input 
              type="range" 
              min="100" 
              max="8000" 
              step="100" 
              value={maxTokens}
              onChange={handleMaxTokensChange}
              className="form-control-range"
              disabled={!isEditable}
            />
          </div>
          
          {isO3Model && (
            <div className="form-group">
              <label>Reasoning Effort</label>
              <select 
                value={reasoningEffort} 
                onChange={handleReasoningEffortChange}
                className="form-control"
                disabled={!isEditable}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}
          
          {supportsSystemPrompt && (
            <div className="form-group">
              <div className="prompt-header">
                <label>System Prompt</label>
                <select 
                  value={selectedPrompt} 
                  onChange={handlePromptTypeChange}
                  className="form-control-select"
                  disabled={!isEditable}
                >
                  <option value="none">None</option>
                  <option value="custom">Custom</option>
                  {systemPrompts && Object.keys(systemPrompts).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              
              {selectedPrompt === 'custom' && (
                <div className="prompt-container">
                  <textarea
                    className="prompt-input"
                    value={systemPrompt}
                    onChange={handleCustomPromptChange}
                    placeholder="Enter custom system prompt..."
                    rows={4}
                    disabled={!isEditable}
                  />
                  {isEditable && (
                    <button 
                      className="save-btn"
                      onClick={handleCustomPromptSave}
                    >
                      Save
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="form-group">
            <div className="prompt-header">
              <label>User Prompt</label>
              {isEditable && (
                <button 
                  className="add-placeholder-btn"
                  onClick={handleAddPlaceholder}
                  title="Add Prior Output Placeholder"
                >
                  Insert {"{prior_output}"}
                </button>
              )}
            </div>
            
            <div className="prompt-container">
              <textarea
                ref={userPromptRef}
                className="prompt-input"
                value={userPrompt}
                onChange={handleUserPromptChange}
                placeholder="Enter user prompt to be used with the output from the previous participant. Use {prior_output} to place where the previous output should appear."
                rows={4}
                disabled={!isEditable}
              />
              {isEditable && (
                <button 
                  className="save-btn"
                  onClick={handleUserPromptSave}
                >
                  Save
                </button>
              )}
            </div>
            
            <div className="help-text">
              <p>This prompt will be used when this participant receives output from the previous participant. 
              Use {"{prior_output}"} to specify where the previous output should be inserted.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantItem;