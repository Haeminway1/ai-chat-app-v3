import React, { useState } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import './LoopControls.css';

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
  
  const handleStart = () => {
    if (!initialPrompt.trim()) {
      setError('Please enter an initial prompt to start the loop.');
      return;
    }
    
    // Check if there are participants
    if (!currentLoop?.participants.length) {
      setError('Please add at least one participant to start the loop.');
      return;
    }
    
    setError('');
    startLoopWithPrompt(loopId, initialPrompt);
    setInitialPrompt('');
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
            <textarea
              className="initial-prompt-input"
              value={initialPrompt}
              onChange={(e) => {
                setInitialPrompt(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              placeholder="Enter an initial prompt to start the loop..."
              rows={3}
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
            <span>Loop is running...</span>
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