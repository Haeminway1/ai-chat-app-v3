import React, { useState, useEffect, useRef } from 'react';
import { useModel } from '../../contexts/ModelContext';
import './StopSequenceItem.css';

const StopSequenceItem = ({ 
  stopSequence, 
  index, 
  isFirst, 
  isLast, 
  onUpdate, 
  onRemove, 
  onMoveUp, 
  onMoveDown, 
  isEditable, 
  totalStopSequences 
}) => {
  const { modelConfigs } = useModel();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(stopSequence?.display_name || '');
  const [selectedModel, setSelectedModel] = useState(stopSequence?.model || '');
  const [systemPrompt, setSystemPrompt] = useState(stopSequence?.system_prompt || '');
  const [stopCondition, setStopCondition] = useState(stopSequence?.stop_condition || '');
  
  // Temperature and other settings
  const [temperature, setTemperature] = useState(stopSequence?.temperature || 0.7);
  
  // Get initial parameter values from model config when a model is selected
  useEffect(() => {
    if (selectedModel && modelConfigs && modelConfigs[selectedModel]) {
      const config = modelConfigs[selectedModel];
      setTemperature(config.temperature || 0.7);
    }
  }, [selectedModel, modelConfigs]);
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleNameUpdate = () => {
    if (name !== stopSequence?.display_name) {
      onUpdate({ ...stopSequence, display_name: name });
    }
    setIsEditingName(false);
  };
  
  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameUpdate();
    } else if (e.key === 'Escape') {
      setName(stopSequence?.display_name || '');
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
        ...stopSequence,
        model: newModel,
        temperature: config.temperature || 0.7
      };
      
      onUpdate(updates);
    } else {
      onUpdate({ ...stopSequence, model: newModel });
    }
  };
  
  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
  };
  
  const handleSystemPromptSave = () => {
    onUpdate({ ...stopSequence, system_prompt: systemPrompt });
  };
  
  const handleStopConditionChange = (e) => {
    setStopCondition(e.target.value);
  };
  
  const handleStopConditionSave = () => {
    onUpdate({ ...stopSequence, stop_condition: stopCondition });
  };
  
  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove this stop sequence?`)) {
      onRemove();
    }
  };
  
  // Handle temperature
  const handleTemperatureChange = (e) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);
    onUpdate({ ...stopSequence, temperature: newTemp });
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
    <div className={`stop-sequence-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="stop-sequence-header" onClick={handleToggleExpand}>
        <div className="stop-sequence-order">{index + 1}</div>
        
        {isEditingName ? (
          <div className="stop-sequence-name-edit" onClick={e => e.stopPropagation()}>
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
          <div className="stop-sequence-name" onDoubleClick={() => setIsEditingName(true)}>
            {stopSequence?.display_name || `Stop Sequence ${index + 1}`}
          </div>
        )}
        
        <div className="stop-sequence-model">
          {stopSequence?.model || 'No model'}
        </div>
        
        <div className="stop-sequence-controls">
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
            title="Remove Stop Sequence"
            disabled={!isEditable}
          >
            ×
          </button>
          <div className="expand-indicator">{isExpanded ? '▼' : '▶'}</div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="stop-sequence-details">
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
            <div className="help-text">
              <p>The AI model used to evaluate the stop condition.</p>
            </div>
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
            <div className="prompt-header">
              <label>Stop Condition</label>
            </div>
            <div className="prompt-container">
              <textarea
                className="prompt-input"
                value={stopCondition}
                onChange={handleStopConditionChange}
                placeholder="Enter the stop condition. The loop will stop when this condition is met."
                rows={4}
                disabled={!isEditable}
              />
              {isEditable && (
                <button 
                  className="save-btn"
                  onClick={handleStopConditionSave}
                >
                  Save
                </button>
              )}
            </div>
            <div className="help-text">
              <p>This condition will be evaluated against the entire conversation history. If the condition is met, the loop will stop.</p>
              <p>Simple example: "STOP" - The loop will stop if the latest message contains "STOP"</p>
              <p>Complex example: "If the conversation includes a solution to the algorithm problem" or "If the conversation has reached a logical conclusion"</p>
            </div>
          </div>
          
          <div className="form-group">
            <div className="prompt-header">
              <label>System Prompt</label>
            </div>
            <div className="prompt-container">
              <textarea
                className="prompt-input"
                value={systemPrompt}
                onChange={handleSystemPromptChange}
                placeholder="Enter system prompt for the AI that evaluates the stop condition..."
                rows={4}
                disabled={!isEditable}
              />
              {isEditable && (
                <button 
                  className="save-btn"
                  onClick={handleSystemPromptSave}
                >
                  Save
                </button>
              )}
            </div>
            <div className="help-text">
              <p>If a system prompt is provided, the stop condition will be evaluated by an AI model using this prompt. This allows for more complex stop conditions.</p>
              <p>Leave empty to use simple string matching for the stop condition.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StopSequenceItem; 