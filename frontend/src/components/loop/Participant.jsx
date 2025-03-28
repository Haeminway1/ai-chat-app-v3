import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useModel } from '../../contexts/ModelContext';
import { useLoop } from '../../contexts/LoopContext';
import './Participant.css';

// Track changes at the module level to prevent conflicts between components
const pendingUpdates = {};

const Participant = ({ participant, index, loopId, isExpanded, onToggleExpand }) => {
  const { modelConfigs } = useModel();
  const { updateLoopParticipant, removeLoopParticipant } = useLoop();
  
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
      setName(participant.display_name || `Participant ${index + 1}`);
      setModel(participant.model || 'gpt-4o');
      setTemperature(participant.temperature || 0.7);
      setMaxTokens(participant.max_tokens || 4000);
      setSystemPrompt(participant.system_prompt || '');
      setUserPrompt(participant.user_prompt || '');
      
      // Clear the pending update flag
      delete pendingUpdates[participantKey];
    }
  }, [participant, index, participantKey]);

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
      setSaveStatus('Saving...');
      
      const updates = {
        display_name: name,
        model,
        temperature,
        max_tokens: maxTokens,
        system_prompt: systemPrompt,
        user_prompt: userPrompt
      };
      
      console.log(`Updating participant ${participant.id} in loop ${loopId}:`, updates);
      
      updateLoopParticipant(loopId, participant.id, updates)
        .then(() => {
          setSaveStatus('Saved');
          setTimeout(() => setSaveStatus(''), 1500);
          // Keep the flag for a bit longer to prevent immediate overwrites
          setTimeout(() => {
            delete pendingUpdates[participantKey];
          }, 1000);
        })
        .catch(error => {
          console.error('Error saving participant:', error);
          setSaveStatus('Error saving');
          setTimeout(() => setSaveStatus(''), 2000);
          delete pendingUpdates[participantKey];
        });
    }, 500); // 500ms debounce
  }, [name, model, temperature, maxTokens, systemPrompt, userPrompt, participant.id, loopId, updateLoopParticipant, participantKey]);

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
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
      removeLoopParticipant(loopId, participant.id);
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
      
      // Trigger save
      setTimeout(() => {
        handleSave();
      }, 100);
      
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
      handleSave();
    }
  };

  return (
    <>
      {isExpanded && <div className="overlay" onClick={onToggleExpand} />}
      <div className={`participant ${isExpanded ? 'expanded' : ''}`}>
        <div className="participant-header" onClick={onToggleExpand}>
          <div className="participant-number">{index + 1}</div>
          <div className="participant-name">{name}</div>
          <div className="participant-model-badge">{model}</div>
          <div className="participant-actions">
            {saveStatus && <span className="save-status">{saveStatus}</span>}
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
              <label>System Prompt</label>
              <textarea 
                rows="6"
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  handleSave();
                }}
                onBlur={handleSaveNow}
                className="form-control"
                placeholder="Enter system instructions for this participant..."
              />
            </div>
            
            <div className="form-group">
              <div className="user-prompt-header">
                <label>User Prompt</label>
                <button 
                  className="add-prior-output-btn"
                  onClick={handleAddPriorOutputPlaceholder}
                  title="Add prior output placeholder"
                >
                  Insert {"{prior_output}"}
                </button>
              </div>
              <textarea 
                ref={userPromptRef}
                rows="6"
                value={userPrompt}
                onChange={(e) => {
                  setUserPrompt(e.target.value);
                  handleSave();
                }}
                onBlur={handleSaveNow}
                className="form-control"
                placeholder="Enter user prompt for this participant (use {prior_output} to include the previous participant's response)..."
              />
              <div className="help-text">
                <p>Use {"{prior_output}"} placeholder to specify where the previous participant's response should be inserted in your prompt.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Participant; 