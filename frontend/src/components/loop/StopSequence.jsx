import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useModel } from '../../contexts/ModelContext';
import { useLoop } from '../../contexts/LoopContext';
import './StopSequence.css';
import ReactDOM from 'react-dom';

// Track changes at the module level to prevent conflicts between components
const pendingUpdates = {};

const StopSequence = ({ 
  sequence, 
  index, 
  loopId, 
  isExpanded, 
  onToggleExpand,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isEditable,
  totalStopSequences
}) => {
  const { modelConfigs } = useModel();
  
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
      // 값이 변경된 경우에만 상태 업데이트 (불필요한 리렌더링 방지)
      const newName = sequence.display_name || `Stop Sequence ${index + 1}`;
      const newModel = sequence.model || 'gpt-4o';
      const newTemperature = sequence.temperature || 0.7;
      const newMaxTokens = sequence.max_tokens || 4000;
      const newSystemPrompt = sequence.system_prompt || '';
      const newStopCondition = sequence.stop_condition || '';
      
      // 값이 변경된 경우에만 상태 업데이트 (불필요한 리렌더링 방지)
      if (name !== newName) setName(newName);
      if (model !== newModel) setModel(newModel);
      if (temperature !== newTemperature) setTemperature(newTemperature);
      if (maxTokens !== newMaxTokens) setMaxTokens(newMaxTokens);
      if (systemPrompt !== newSystemPrompt) setSystemPrompt(newSystemPrompt);
      if (stopCondition !== newStopCondition) setStopCondition(newStopCondition);
      
      // Clear the pending update flag
      delete pendingUpdates[sequenceKey];
    }
  }, [sequence, index, sequenceKey, name, model, temperature, maxTokens, systemPrompt, stopCondition]);
  
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
      // 저장 중인 상태로 설정하기 전에 상태가 이미 처리되었는지 확인
      if (!pendingUpdates[sequenceKey]) return;
      
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
      
      // 현재 값의 스냅샷 저장
      const snapshot = { ...updates };
      
      onUpdate(updates);
      
      // 저장 후 깜빡거림을 줄이기 위해 디바운스
      setTimeout(() => {
        // 값이 아직 동일한지 확인 (사용자가 다시 변경하지 않았는지)
        if (
          name === snapshot.display_name &&
          model === snapshot.model &&
          temperature === snapshot.temperature &&
          maxTokens === snapshot.max_tokens &&
          systemPrompt === snapshot.system_prompt &&
          stopCondition === snapshot.stop_condition
        ) {
          setSaveStatus('Saved');
          setTimeout(() => setSaveStatus(''), 1000);
        }
        
        // Keep the flag for a bit longer to prevent immediate overwrites
        setTimeout(() => {
          delete pendingUpdates[sequenceKey];
        }, 500);
      }, 300);
    }, 500); // 500ms debounce
  }, [name, model, temperature, maxTokens, systemPrompt, stopCondition, sequence.id, loopId, onUpdate, sequenceKey]);
  
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
    const newModel = e.target.value;
    setModel(newModel);
    
    // Immediately save without debounce for model changes
    setSaveStatus('Saving...');
    
    const updates = {
      display_name: name,
      model: newModel,
      temperature: parseFloat(temperature) || 0.7,
      max_tokens: parseInt(maxTokens) || 4000,
      system_prompt: systemPrompt,
      stop_condition: stopCondition
    };
    
    console.log(`Updating model for stop sequence ${sequence.id} in loop ${loopId}:`, updates);
    
    // We're skipping the debounce for model changes
    pendingUpdates[sequenceKey] = true;
    lastUpdateRef.current = Date.now();
    
    onUpdate(updates);
    setSaveStatus('Saved');
    setTimeout(() => setSaveStatus(''), 1500);
    setTimeout(() => {
      delete pendingUpdates[sequenceKey];
    }, 1000);
  };
  
  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove this stop sequence?`)) {
      onRemove();
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
  
  // Add effect to dispatch modal state change event
  useEffect(() => {
    // Dispatch event when expanded state changes
    const event = new CustomEvent('modal_state_changed', {
      detail: { 
        type: 'modal_state_changed',
        isOpen: isExpanded,
        componentType: 'stopSequence',
        id: sequence.id
      }
    });
    window.dispatchEvent(event);
  }, [isExpanded, sequence.id]);
  
  return (
    <>
      {isExpanded && ReactDOM.createPortal(
        <div className="overlay" onClick={onToggleExpand} />,
        document.body
      )}
      <div 
        className={`stop-sequence ${isExpanded ? 'expanded' : ''}`} 
        style={isExpanded ? {zIndex: 1300} : {}}
      >
        <div className="stop-sequence-header" onClick={onToggleExpand}>
          <div className="stop-sequence-number">{index + 1}</div>
          <div className="stop-sequence-value">
            {name}: {stopCondition ? stopCondition.substring(0, 30) + (stopCondition.length > 30 ? "..." : "") : "Empty sequence"}
          </div>
          <div className="stop-sequence-actions">
            {!isFirst && (
              <button 
                className="move-up-button"
                onClick={e => { e.stopPropagation(); onMoveUp(); }}
                title="Move Up"
                disabled={!isEditable}
              >
                <FiArrowUp />
              </button>
            )}
            {!isLast && (
              <button 
                className="move-down-button"
                onClick={e => { e.stopPropagation(); onMoveDown(); }}
                title="Move Down"
                disabled={!isEditable}
              >
                <FiArrowDown />
              </button>
            )}
            {saveStatus && <span className="save-status">{saveStatus}</span>}
            <button 
              className="remove-stop-sequence" 
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              disabled={!isEditable}
            >
              <FiX />
            </button>
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </div>
        </div>
        
        {isExpanded && ReactDOM.createPortal(
          <div className="stop-sequence-modal">
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
                  disabled={!isEditable}
                />
              </div>
              
              <div className="form-group">
                <label>Model</label>
                <select 
                  value={model}
                  onChange={handleModelChange}
                  className="form-control"
                  disabled={!isEditable}
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
                      disabled={!isEditable}
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
                      disabled={!isEditable}
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
                      disabled={!isEditable}
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
                      disabled={!isEditable}
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
                  disabled={!isEditable}
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
                  disabled={!isEditable}
                />
                <div className="help-text">
                  <p>If a system prompt is provided, the stop condition will be evaluated by an AI model using this prompt. This allows for more complex stop conditions.</p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
};

export default StopSequence; 