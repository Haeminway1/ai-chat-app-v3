import React, { useState, useEffect } from 'react';
import { useModel } from '../../contexts/ModelContext';
import { useSettings } from '../../contexts/SettingsContext';
import './ParticipantItem.css';

// Simplified version without react-beautiful-dnd dependency
const ParticipantItem = ({ participant, index, loopId, onUpdate, onRemove, onMoveUp, onMoveDown }) => {
  const { modelConfigs } = useModel();
  const { systemPrompts } = useSettings();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(participant.display_name);
  const [selectedModel, setSelectedModel] = useState(participant.model);
  const [selectedPrompt, setSelectedPrompt] = useState('custom');
  const [systemPrompt, setSystemPrompt] = useState(participant.system_prompt);
  
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
    onUpdate(participant.id, { model: newModel });
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
              
              {selectedPrompt === 'custom' && (
                <div className="custom-prompt-editor">
                  <textarea
                    value={systemPrompt}
                    onChange={handleCustomPromptChange}
                    onBlur={handleCustomPromptSave}
                    placeholder="Enter a custom system prompt for this participant..."
                    rows={4}
                  />
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