import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useModel } from '../../contexts/ModelContext';
import { useLoop } from '../../contexts/LoopContext';
import './Participant.css';

const Participant = ({ participant, index, isExpanded, onToggleExpand }) => {
  const { modelConfigs } = useModel();
  const { updateParticipant, removeParticipant } = useLoop();
  
  const [name, setName] = useState(participant.name || `Participant ${index + 1}`);
  const [model, setModel] = useState(participant.model || 'gpt-4o');
  const [temperature, setTemperature] = useState(participant.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(participant.maxTokens || 4000);
  const [systemPrompt, setSystemPrompt] = useState(participant.systemPrompt || '');

  useEffect(() => {
    setName(participant.name || `Participant ${index + 1}`);
    setModel(participant.model || 'gpt-4o');
    setTemperature(participant.temperature || 0.7);
    setMaxTokens(participant.maxTokens || 4000);
    setSystemPrompt(participant.systemPrompt || '');
  }, [participant, index]);

  const handleSave = () => {
    updateParticipant(index, {
      ...participant,
      name,
      model,
      temperature,
      maxTokens,
      systemPrompt
    });
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
      removeParticipant(index);
    }
  };

  const getModelOptions = () => {
    if (!modelConfigs) return <option value="">Loading models...</option>;
    
    return Object.keys(modelConfigs).map(modelKey => (
      <option key={modelKey} value={modelKey}>
        {modelConfigs[modelKey].display_name || modelKey}
      </option>
    ));
  };

  return (
    <div className={`participant ${isExpanded ? 'expanded' : ''}`}>
      <div className="participant-header" onClick={onToggleExpand}>
        <div className="participant-number">{index + 1}</div>
        <div className="participant-name">{name}</div>
        <div className="participant-model-badge">{model}</div>
        <div className="participant-actions">
          <button 
            className="remove-participant" 
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
          >
            <FiX />
          </button>
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="participant-details">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Model</label>
            <select 
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                handleSave();
              }}
              className="form-control"
            >
              {getModelOptions()}
            </select>
          </div>
          
          <div className="form-group">
            <label>Temperature: {temperature.toFixed(2)}</label>
            <div className="parameter-control">
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.01" 
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                onMouseUp={handleSave}
                onTouchEnd={handleSave}
              />
              <input 
                type="number" 
                min="0" 
                max="2" 
                step="0.01"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                onBlur={handleSave}
                className="parameter-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Max Tokens: {maxTokens}</label>
            <div className="parameter-control">
              <input 
                type="range" 
                min="100" 
                max="8000" 
                step="100" 
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                onMouseUp={handleSave}
                onTouchEnd={handleSave}
              />
              <input 
                type="number"
                min="100" 
                max="8000" 
                step="100"  
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                onBlur={handleSave}
                className="parameter-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>System Prompt</label>
            <textarea 
              rows="4"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              onBlur={handleSave}
              className="form-control"
              placeholder="Enter system instructions for this participant..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Participant; 