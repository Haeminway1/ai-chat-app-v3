import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useModel } from '../../contexts/ModelContext';
import { useLoop } from '../../contexts/LoopContext';
import './StopSequence.css';

// Track changes at the module level to prevent conflicts between components
const pendingUpdates = {};

const StopSequence = ({ sequence, index, loopId, isExpanded, onToggleExpand }) => {
  const { modelConfigs } = useModel();
  const { updateStopSequence, removeStopSequence } = useLoop();
  
  // Create a unique key for this stop sequence
  const sequenceKey = `${loopId}-${sequence.id}`;
  
  const [name, setName] = useState(sequence.display_name || `Stop Sequence ${index + 1}`);
  const [model, setModel] = useState(sequence.model || 'gpt-4o');
  const [temperature, setTemperature] = useState(sequence.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(sequence.max_tokens || 4000);
  const [systemPrompt, setSystemPrompt] = useState(sequence.system_prompt || '');
  const [stopCondition, setStopCondition] = useState(sequence.stop_condition || '');
  const [saveStatus, setSaveStatus] = useState('');
  
  // Ref to track the debounce timer
  const saveTimerRef = useRef(null);
  // Track the last update timestamp
  const lastUpdateRef = useRef(Date.now());
  // Keep a local copy of the sequence data
  const sequenceRef = useRef(sequence);
  
  // Update the sequenceRef when the sequence prop changes
  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);
  
  useEffect(() => {
    // Only update if there are no pending saves for this sequence
    // or if it's been more than 2 seconds since the last update
    if (!pendingUpdates[sequenceKey] || 
        Date.now() - lastUpdateRef.current > 2000) {
      
      // Update local state with the latest values from the sequence prop
      setName(sequence.display_name || `Stop Sequence ${index + 1}`);
      setModel(sequence.model || 'gpt-4o');
      setTemperature(sequence.temperature || 0.7);
      setMaxTokens(sequence.max_tokens || 4000);
      setSystemPrompt(sequence.system_prompt || '');
      setStopCondition(sequence.stop_condition || '');
      
      // Clear the pending update flag
      delete pendingUpdates[sequenceKey];
    }
  }, [sequence, index, sequenceKey]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear timers and pending updates
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      delete pendingUpdates[sequenceKey];
    };
  }, [sequenceKey]);
  
  const handleSave = useCallback(() => {
    // Mark that we have pending changes
    pendingUpdates[sequenceKey] = true;
    lastUpdateRef.current = Date.now();
    
    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Set a new timer
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('Saving...');
      
      const updates = {
        display_name: name,
        model,
        temperature,
        max_tokens: maxTokens,
        system_prompt: systemPrompt,
        stop_condition: stopCondition
      };
      
      console.log(`Updating stop sequence ${sequence.id} in loop ${loopId}:`, updates);
      
      updateStopSequence(loopId, sequence.id, updates)
        .then(() => {
          setSaveStatus('Saved');
          setTimeout(() => setSaveStatus(''), 1500);
          // Keep the flag for a bit longer to prevent immediate overwrites
          setTimeout(() => {
            delete pendingUpdates[sequenceKey];
          }, 1000);
        })
        .catch(error => {
          console.error('Error saving stop sequence:', error);
          setSaveStatus('Error saving');
          setTimeout(() => setSaveStatus(''), 2000);
          delete pendingUpdates[sequenceKey];
        });
    }, 500); // 500ms debounce
  }, [name, model, temperature, maxTokens, systemPrompt, stopCondition, sequence.id, loopId, updateStopSequence, sequenceKey]);
  
  // Immediate save without debounce
  const handleSaveNow = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    handleSave();
  }, [handleSave]);
  
  // Auto-save on model change immediately
  const handleModelChange = (e) => {
    setModel(e.target.value);
    setTimeout(handleSaveNow, 100); // Small delay to ensure state is updated
  };
  
  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove this stop sequence?`)) {
      removeStopSequence(loopId, sequence.id);
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
  
  const handleStopConditionChange = (e) => {
    setStopCondition(e.target.value);
    handleSave();
  };
  
  const handleStopConditionSave = (e) => {
    handleSave();
  };
  
  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
    handleSave();
  };
  
  const handleSystemPromptSave = (e) => {
    handleSave();
  };
  
  return (
    <>
      {isExpanded && <div className="overlay" onClick={onToggleExpand} />}
      <div className={`stop-sequence ${isExpanded ? 'expanded' : ''}`}>
        <div className="stop-sequence-header" onClick={onToggleExpand}>
          <div className="stop-sequence-number">{index + 1}</div>
          <div className="stop-sequence-value">
            {name}: {stopCondition ? stopCondition.substring(0, 30) + (stopCondition.length > 30 ? "..." : "") : "Empty sequence"}
          </div>
          <div className="stop-sequence-actions">
            {saveStatus && <span className="save-status">{saveStatus}</span>}
            <button 
              className="remove-stop-sequence" 
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
          <div className="stop-sequence-details">
            <button 
              className="close-expanded-view" 
              onClick={onToggleExpand}
            >
              Close <FiX />
            </button>
            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleSave();
                }}
                onBlur={handleSaveNow}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label>Model</label>
              <select 
                value={model}
                onChange={handleModelChange}
                className="form-control"
              >
                {getModelOptions()}
              </select>
            </div>
            
            {/* Two-column grid layout for parameters */}
            <div className="parameter-grid">
              <div className="form-group">
                <label>Temperature: {temperature.toFixed(2)}</label>
                <div className="parameter-control">
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.01" 
                    value={temperature}
                    onChange={(e) => {
                      setTemperature(parseFloat(e.target.value));
                      handleSave();
                    }}
                    onMouseUp={handleSaveNow}
                    onTouchEnd={handleSaveNow}
                  />
                  <input 
                    type="number" 
                    min="0" 
                    max="2" 
                    step="0.01"
                    value={temperature}
                    onChange={(e) => {
                      setTemperature(parseFloat(e.target.value));
                      handleSave();
                    }}
                    onBlur={handleSaveNow}
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
                    onChange={(e) => {
                      setMaxTokens(parseInt(e.target.value));
                      handleSave();
                    }}
                    onMouseUp={handleSaveNow}
                    onTouchEnd={handleSaveNow}
                  />
                  <input 
                    type="number"
                    min="100" 
                    max="8000" 
                    step="100"  
                    value={maxTokens}
                    onChange={(e) => {
                      setMaxTokens(parseInt(e.target.value));
                      handleSave();
                    }}
                    onBlur={handleSaveNow}
                    className="parameter-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <div className="user-prompt-header">
                <label>Stop Condition</label>
              </div>
              <textarea 
                className="form-control"
                value={stopCondition}
                onChange={handleStopConditionChange}
                placeholder="Enter the stop condition. The loop will stop when this condition is met."
                rows={4}
                onBlur={handleStopConditionSave}
              />
              <div className="help-text">
                <p>The loop will stop when the latest message from any participant contains this text.</p>
              </div>
            </div>
            
            <div className="form-group">
              <div className="user-prompt-header">
                <label>System Prompt</label>
              </div>
              <textarea 
                className="form-control"
                value={systemPrompt}
                onChange={handleSystemPromptChange}
                placeholder="Enter system prompt for the AI that evaluates the stop condition..."
                rows={4}
                onBlur={handleSystemPromptSave}
              />
              <div className="help-text">
                <p>If a system prompt is provided, the stop condition will be evaluated by an AI model using this prompt. This allows for more complex stop conditions.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StopSequence; 