import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useModel } from '../../contexts/ModelContext';
import { useLoop } from '../../contexts/LoopContext';
import './Participant.css';
import ReactDOM from 'react-dom';

// Track changes at the module level to prevent conflicts between components
const pendingUpdates = {};

const Participant = ({ 
  participant, 
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
  totalParticipants
}) => {
  const { modelConfigs } = useModel();
  
  // Create a unique key for this participant
  const participantKey = `${loopId}-${participant.id}`;
  
  const [name, setName] = useState(participant.display_name || `Participant ${index + 1}`);
  const [model, setModel] = useState(participant.model || 'gpt-4o');
  const [temperature, setTemperature] = useState(participant.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(participant.max_tokens || 4000);
  const [systemPrompt, setSystemPrompt] = useState(participant.system_prompt || '');
  const [userPrompt, setUserPrompt] = useState(participant.user_prompt || '');
  const [saveStatus, setSaveStatus] = useState('');
  
  // Ref for the user prompt textarea to track cursor position
  const userPromptRef = useRef(null);
  
  // Ref to track the debounce timer
  const saveTimerRef = useRef(null);
  // Track the last update timestamp
  const lastUpdateRef = useRef(Date.now());
  // Keep a local copy of the participant data
  const participantRef = useRef(participant);

  // Update the participantRef when the participant prop changes
  useEffect(() => {
    participantRef.current = participant;
  }, [participant]);

  useEffect(() => {
    // Only update if there are no pending saves for this participant
    // or if it's been more than 2 seconds since the last update
    if (!pendingUpdates[participantKey] || 
        Date.now() - lastUpdateRef.current > 2000) {
      
      // Update local state with the latest values from the participant prop
      // Use functional updates to only update if values actually changed
      const newName = participant.display_name || `Participant ${index + 1}`;
      const newModel = participant.model || 'gpt-4o';
      const newTemperature = participant.temperature || 0.7;
      const newMaxTokens = participant.max_tokens || 4000;
      const newSystemPrompt = participant.system_prompt || '';
      const newUserPrompt = participant.user_prompt || '';
      
      // 값이 변경된 경우에만 상태 업데이트 (불필요한 리렌더링 방지)
      if (name !== newName) setName(newName);
      if (model !== newModel) setModel(newModel);
      if (temperature !== newTemperature) setTemperature(newTemperature);
      if (maxTokens !== newMaxTokens) setMaxTokens(newMaxTokens);
      if (systemPrompt !== newSystemPrompt) setSystemPrompt(newSystemPrompt);
      if (userPrompt !== newUserPrompt) setUserPrompt(newUserPrompt);
      
      // Clear the pending update flag
      delete pendingUpdates[participantKey];
    }
  }, [participant, index, participantKey, name, model, temperature, maxTokens, systemPrompt, userPrompt]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear timers and pending updates
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      delete pendingUpdates[participantKey];
    };
  }, [participantKey]);

  // Debounced save function
  const handleSave = useCallback(() => {
    // Mark that we have pending changes
    pendingUpdates[participantKey] = true;
    lastUpdateRef.current = Date.now();
    
    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Set a new timer
    saveTimerRef.current = setTimeout(() => {
      // 저장 중인 상태로 설정하기 전에 상태가 이미 처리되었는지 확인
      if (!pendingUpdates[participantKey]) return;
      
      setSaveStatus('Saving...');
      
      const tempValue = parseFloat(temperature);
      const tokensValue = parseInt(maxTokens);
      
      const updates = {
        display_name: name,
        model: model,
        temperature: isNaN(tempValue) ? 0.7 : tempValue,
        max_tokens: isNaN(tokensValue) ? 4000 : tokensValue,
        system_prompt: systemPrompt,
        user_prompt: userPrompt
      };
      
      console.log(`Updating participant ${participant.id} in loop ${loopId}:`, updates);
      
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
          userPrompt === snapshot.user_prompt
        ) {
          setSaveStatus('Saved');
          setTimeout(() => setSaveStatus(''), 1000);
        }
        
        // Keep the flag for a bit longer to prevent immediate overwrites
        setTimeout(() => {
          delete pendingUpdates[participantKey];
        }, 500);
      }, 300);
    }, 500); // 500ms debounce
  }, [name, model, temperature, maxTokens, systemPrompt, userPrompt, participant.id, loopId, onUpdate, participantKey]);

  // Immediate save without debounce
  const handleSaveNow = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    
    // Mark that we have pending changes
    pendingUpdates[participantKey] = true;
    lastUpdateRef.current = Date.now();
    
    setSaveStatus('Saving...');
    
    const updates = {
      display_name: name,
      model: model,
      temperature: parseFloat(temperature) || 0.7,
      max_tokens: parseInt(maxTokens) || 4000,
      system_prompt: systemPrompt,
      user_prompt: userPrompt
    };
    
    console.log(`Immediate update for participant ${participant.id} in loop ${loopId}:`, updates);
    
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
        userPrompt === snapshot.user_prompt
      ) {
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 1000);
      }
      
      // Keep the flag for a bit longer to prevent immediate overwrites
      setTimeout(() => {
        delete pendingUpdates[participantKey];
      }, 500);
    }, 300);
  }, [name, model, temperature, maxTokens, systemPrompt, userPrompt, participant.id, loopId, onUpdate, participantKey]);

  // Handle numeric input changes with improved handling
  const handleTemperatureChange = (e) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 2) {
      setTemperature(newValue);
      
      // 디바운스 타이머 설정 - 실제 저장은 입력이 멈추면 수행
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      
      pendingUpdates[participantKey] = true;
      lastUpdateRef.current = Date.now();
      
      saveTimerRef.current = setTimeout(() => {
        const updates = {
          display_name: name,
          model: model,
          temperature: newValue,
          max_tokens: parseInt(maxTokens) || 4000,
          system_prompt: systemPrompt,
          user_prompt: userPrompt
        };
        
        console.log(`Updating temperature for participant ${participant.id} in loop ${loopId}:`, updates);
        
        onUpdate(updates);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 500);
      }, 300);
    } else {
      // 유효하지 않은 값은 기존 값으로 복원
      e.target.value = temperature;
    }
  };

  const handleMaxTokensChange = (e) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue) && newValue >= 100 && newValue <= 8000) {
      setMaxTokens(newValue);
      
      // 디바운스 타이머 설정 - 실제 저장은 입력이 멈추면 수행
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      
      pendingUpdates[participantKey] = true;
      lastUpdateRef.current = Date.now();
      
      saveTimerRef.current = setTimeout(() => {
        const updates = {
          display_name: name,
          model: model,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: newValue,
          system_prompt: systemPrompt,
          user_prompt: userPrompt
        };
        
        console.log(`Updating max tokens for participant ${participant.id} in loop ${loopId}:`, updates);
        
        onUpdate(updates);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 500);
      }, 300);
    } else {
      // 유효하지 않은 값은 기존 값으로 복원
      e.target.value = maxTokens;
    }
  };

  // Auto-save on model change immediately
  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setModel(newModel);
    
    // Immediately save without debounce for model changes
    setSaveStatus('Saving...');
    
    // Mark as pending update
    pendingUpdates[participantKey] = true;
    lastUpdateRef.current = Date.now();
    
    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    
    const updates = {
      display_name: name,
      model: newModel,
      temperature: parseFloat(temperature) || 0.7,
      max_tokens: parseInt(maxTokens) || 4000,
      system_prompt: systemPrompt,
      user_prompt: userPrompt
    };
    
    console.log(`Updating model for participant ${participant.id} in loop ${loopId}:`, updates);
    
    // We're skipping the debounce for model changes
    onUpdate(updates);
    setSaveStatus('Saved');
    setTimeout(() => setSaveStatus(''), 1500);
    setTimeout(() => {
      delete pendingUpdates[participantKey];
    }, 1000);
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
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
  
  const handleAddPriorOutputPlaceholder = () => {
    const placeholder = "{prior_output}";
    
    // If the textarea has a selection, insert at selection
    if (userPromptRef.current) {
      const start = userPromptRef.current.selectionStart;
      const end = userPromptRef.current.selectionEnd;
      
      const text = userPrompt;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      const newText = before + placeholder + after;
      setUserPrompt(newText);
      
      // 저장 처리 로직
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      
      pendingUpdates[participantKey] = true;
      lastUpdateRef.current = Date.now();
      
      // 디바운스된 저장 실행
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('Saving...');
        
        const updates = {
          display_name: name,
          model: model,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 4000,
          system_prompt: systemPrompt,
          user_prompt: newText
        };
        
        console.log(`Updating user prompt with placeholder for participant ${participant.id} in loop ${loopId}:`, updates);
        
        onUpdate(updates);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 500);
      }, 300);
      
      // Set cursor position after the inserted placeholder
      setTimeout(() => {
        if (userPromptRef.current) {
          userPromptRef.current.focus();
          userPromptRef.current.setSelectionRange(
            start + placeholder.length,
            start + placeholder.length
          );
        }
      }, 50);
    } else {
      // If no selection, append to end
      const newPrompt = userPrompt 
        ? userPrompt.endsWith('\n') 
          ? `${userPrompt}${placeholder}` 
          : `${userPrompt}\n${placeholder}`
        : placeholder;
        
      setUserPrompt(newPrompt);
      
      // 저장 처리 로직
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      
      pendingUpdates[participantKey] = true;
      lastUpdateRef.current = Date.now();
      
      // 디바운스된 저장 실행
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('Saving...');
        
        const updates = {
          display_name: name,
          model: model,
          temperature: parseFloat(temperature) || 0.7,
          max_tokens: parseInt(maxTokens) || 4000,
          system_prompt: systemPrompt,
          user_prompt: newPrompt
        };
        
        console.log(`Updating user prompt with placeholder for participant ${participant.id} in loop ${loopId}:`, updates);
        
        onUpdate(updates);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 500);
      }, 300);
    }
  };

  // Add effect to dispatch modal state change event
  useEffect(() => {
    // Dispatch event when expanded state changes
    const event = new CustomEvent('modal_state_changed', {
      detail: { 
        type: 'modal_state_changed',
        isOpen: isExpanded,
        componentType: 'participant',
        id: participant.id
      }
    });
    window.dispatchEvent(event);
  }, [isExpanded, participant.id]);

  // 텍스트 입력 필드(user prompt, system prompt) 변경 핸들러
  const handleUserPromptChange = (e) => {
    setUserPrompt(e.target.value);
    // 여러번 저장하지 않고 디바운스만 적용
    handleSave();
  };

  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
    // 여러번 저장하지 않고 디바운스만 적용
    handleSave();
  };

  const handleUserPromptSave = (e) => {
    handleSaveNow();
  };

  const handleSystemPromptSave = (e) => {
    handleSaveNow();
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    handleSave();
  };

  return (
    <>
      {isExpanded && ReactDOM.createPortal(
        <div className="overlay" onClick={onToggleExpand} />,
        document.body
      )}
      <div className={`participant ${isExpanded ? 'expanded' : ''}`} style={isExpanded ? {zIndex: 1200} : {}}>
        <div className="participant-header" onClick={onToggleExpand}>
          <div className="participant-number">{index + 1}</div>
          <div className="participant-name">{name}</div>
          <div className="participant-model-badge">{model}</div>
          <div className="participant-actions">
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
              className="remove-participant" 
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              disabled={!isEditable || totalParticipants <= 1}
            >
              <FiX />
            </button>
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </div>
        </div>
        
        {isExpanded && ReactDOM.createPortal(
          <div className="participant-modal">
            <div className="participant-details">
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
                  onChange={handleNameChange}
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
                      onChange={handleTemperatureChange}
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
                      onChange={handleTemperatureChange}
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
                      onChange={handleMaxTokensChange}
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
                      onChange={handleMaxTokensChange}
                      onBlur={handleSaveNow}
                      className="parameter-input"
                      disabled={!isEditable}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>System Prompt</label>
                <textarea 
                  rows="6"
                  value={systemPrompt}
                  onChange={handleSystemPromptChange}
                  onBlur={handleSystemPromptSave}
                  className="form-control"
                  placeholder="Enter system instructions for this participant..."
                  disabled={!isEditable}
                />
              </div>
              
              <div className="form-group">
                <div className="user-prompt-header">
                  <label>User Prompt</label>
                  <button 
                    className="add-prior-output-btn"
                    onClick={handleAddPriorOutputPlaceholder}
                    title="Add prior output placeholder"
                    disabled={!isEditable}
                  >
                    Insert {"{prior_output}"}
                  </button>
                </div>
                <textarea 
                  ref={userPromptRef}
                  rows="6"
                  value={userPrompt}
                  onChange={handleUserPromptChange}
                  onBlur={handleUserPromptSave}
                  className="form-control"
                  placeholder="Enter user prompt for this participant (use {prior_output} to include the previous participant's response)..."
                  disabled={!isEditable}
                />
                <div className="help-text">
                  <p>Use {"{prior_output}"} placeholder to specify where the previous participant's response should be inserted in your prompt.</p>
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

export default Participant; 