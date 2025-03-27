import React, { useState, useEffect } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import './LoopControls.css';

// Utility functions for prompt management
const loopPromptUtils = {
  savePrompt: (loopId, prompt) => {
    if (!loopId) return;
    localStorage.setItem(`loop_prompt_${loopId}`, prompt || '');
  },
  
  loadPrompt: (loopId) => {
    if (!loopId) return '';
    return localStorage.getItem(`loop_prompt_${loopId}`) || '';
  },
  
  clearPrompt: (loopId) => {
    if (!loopId) return;
    localStorage.removeItem(`loop_prompt_${loopId}`);
  }
};

const LoopControls = ({ loopId }) => {
  const { 
    currentLoop, 
    startLoopWithPrompt, 
    pauseCurrentLoop,
    resumeCurrentLoop, 
    stopCurrentLoop, 
    resetCurrentLoop
  } = useLoop();
  
  const [initialPrompt, setInitialPrompt] = useState('');
  const [error, setError] = useState('');
  
  // Load saved prompt when component mounts or loopId changes
  useEffect(() => {
    if (loopId) {
      const savedPrompt = loopPromptUtils.loadPrompt(loopId);
      setInitialPrompt(savedPrompt);
    }
  }, [loopId]);
  
  const handlePromptChange = (e) => {
    const newPrompt = e.target.value;
    setInitialPrompt(newPrompt);
    
    // Clear error if prompt is not empty
    if (newPrompt.trim()) setError('');
  };
  
  const handleStart = () => {
    if (!initialPrompt.trim()) {
      setError('Please enter an initial prompt to start the loop.');
      return;
    }
    
    // Check for participants
    if (!currentLoop?.participants.length) {
      setError('Please add at least one participant to start the loop.');
      return;
    }
    
    // Clear error
    setError('');
    
    // Save prompt to localStorage
    loopPromptUtils.savePrompt(loopId, initialPrompt);
    
    // Start the loop
    startLoopWithPrompt(loopId, initialPrompt);
  };
  
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset this loop? All messages will be deleted.')) {
      resetCurrentLoop();
    }
  };
  
  const isRunning = currentLoop?.status === 'running';
  const isPaused = currentLoop?.status === 'paused';
  const isStopped = currentLoop?.status === 'stopped' || !currentLoop?.status;
  
  return (
    <div className="loop-controls">
      {isStopped && (
        <div className="start-controls">
          <div className="initial-prompt-container">
            <label>Initial Prompt</label>
            <textarea
              className="initial-prompt-input"
              value={initialPrompt}
              onChange={handlePromptChange}
              placeholder="Enter an initial prompt to start the loop..."
              rows={4}
            />
            {error && <div className="prompt-error">{error}</div>}
          </div>
          
          <button 
            className="start-button primary-button"
            onClick={handleStart}
            disabled={!initialPrompt.trim() || !currentLoop?.participants.length}
          >
            Start Loop
          </button>
        </div>
      )}
      
      {isRunning && (
        <div className="running-controls">
          <div className="running-status">
            <div className="status-indicator running"></div>
            <span>Loop is running</span>
          </div>
          <div className="control-buttons">
            <button 
              className="pause-button"
              onClick={pauseCurrentLoop}
            >
              Pause
            </button>
            <button 
              className="stop-button"
              onClick={stopCurrentLoop}
            >
              Stop
            </button>
          </div>
        </div>
      )}
      
      {isPaused && (
        <div className="paused-controls">
          <div className="running-status">
            <div className="status-indicator paused"></div>
            <span>Loop is paused</span>
          </div>
          <div className="control-buttons">
            <button 
              className="resume-button primary-button"
              onClick={resumeCurrentLoop}
            >
              Resume
            </button>
            <button 
              className="stop-button"
              onClick={stopCurrentLoop}
            >
              Stop
            </button>
          </div>
        </div>
      )}
      
      {/* Reset button is always available except when running */}
      {!isRunning && currentLoop?.messages?.length > 0 && (
        <button 
          className="reset-button"
          onClick={handleReset}
        >
          Reset Loop
        </button>
      )}
    </div>
  );
};

export default LoopControls;