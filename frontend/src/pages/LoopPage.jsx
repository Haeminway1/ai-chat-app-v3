import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoop } from '../contexts/LoopContext';
import LoopHeader from '../components/loop/LoopHeader';
import ParticipantsList from '../components/loop/ParticipantsList';
import LoopControls from '../components/loop/LoopControls';
import LoopMessageList from '../components/loop/LoopMessageList';
import './LoopPage.css';

const LoopPage = () => {
  const { loopId } = useParams();
  const navigate = useNavigate();
  const { 
    currentLoop, 
    loadLoop, 
    createNewLoop, 
    updateLoopName,
    loading, 
    isRunning,
    pauseCurrentLoop,
    resumeCurrentLoop,
    stopCurrentLoop,
    resetCurrentLoop
  } = useLoop();

  const [loadFailed, setLoadFailed] = useState(false);
  const [loadTried, setLoadTried] = useState(false);
  const [view, setView] = useState('setup'); // 'setup' or 'chat'
  
  // Effect to handle loop loading - only load existing loops, don't auto-create
  useEffect(() => {
    // Only handle initial navigation once
    if (!loadTried) {
      setLoadTried(true);
      
      if (loopId) {
        // Try to load an existing loop
        loadLoop(loopId)
          .then(result => {
            if (!result) {
              setLoadFailed(true);
            } else {
              // If loop is running or has messages, switch to chat view
              if (result.status === 'running' || result.status === 'paused' || 
                 (result.messages && result.messages.length > 0)) {
                setView('chat');
              }
            }
          })
          .catch(() => {
            setLoadFailed(true);
          });
      }
    }
  }, [loopId, loadLoop, loadTried, currentLoop]);

  // Effect to set the right view based on loop state
  useEffect(() => {
    if (currentLoop) {
      if (currentLoop.status === 'running' || currentLoop.status === 'paused' || 
         (currentLoop.messages && currentLoop.messages.length > 0)) {
        setView('chat');
      } else if (view === 'chat' && currentLoop.status === 'stopped' && 
                (!currentLoop.messages || currentLoop.messages.length === 0)) {
        setView('setup');
      }
    }
  }, [currentLoop, view]);

  // Handle creation of a new loop
  const handleCreateNewLoop = () => {
    createNewLoop("New Loop").then(newLoop => {
      if (newLoop) {
        navigate(`/loop/${newLoop.id}`, { replace: true });
        setView('setup');
      }
    });
  };

  const handleUpdateLoopTitle = async (newTitle) => {
    if (currentLoop) {
      await updateLoopName(currentLoop.id, newTitle);
    }
  };

  const toggleView = () => {
    setView(view === 'setup' ? 'chat' : 'setup');
  };

  const handlePauseLoop = () => {
    pauseCurrentLoop();
  };

  const handleResumeLoop = () => {
    resumeCurrentLoop();
  };

  const handleStopLoop = () => {
    stopCurrentLoop();
  };

  const handleResetLoop = () => {
    resetCurrentLoop();
  };

  // Show loading state if trying to load a loop
  if (loading && loopId && !currentLoop) {
    return (
      <div className="loop-loading">
        <div className="spinner"></div>
        <p>Loading loop...</p>
      </div>
    );
  }

  // Show error if load failed
  if (loadFailed && !currentLoop) {
    return (
      <div className="loop-loading">
        <p>Failed to load the loop. The loop may have been deleted or doesn't exist.</p>
        <button 
          className="primary-button"
          onClick={handleCreateNewLoop}
        >
          Create New Loop
        </button>
      </div>
    );
  }

  // If no loop is selected, show welcome screen
  if (!loopId && !currentLoop) {
    return (
      <div className="no-loop-selected">
        <p>Select a loop or create a new one to start.</p>
        <button 
          className="primary-button"
          onClick={handleCreateNewLoop}
        >
          New Loop
        </button>
      </div>
    );
  }

  if (!currentLoop) {
    return (
      <div className="loop-loading">
        <div className="spinner"></div>
        <p>Loading loop...</p>
      </div>
    );
  }

  return (
    <div className="loop-page">
      <div className="loop-container">
        <LoopHeader 
          loop={currentLoop} 
          onTitleChange={handleUpdateLoopTitle} 
        />
        
        {/* View toggle button */}
        {(currentLoop.status === 'running' || currentLoop.status === 'paused' || 
          (currentLoop.messages && currentLoop.messages.length > 0)) && (
          <div className="view-toggle">
            <button 
              className={`view-toggle-button ${view === 'setup' ? 'active' : ''}`} 
              onClick={() => setView('setup')}
            >
              Setup
            </button>
            <button 
              className={`view-toggle-button ${view === 'chat' ? 'active' : ''}`} 
              onClick={() => setView('chat')}
            >
              Messages
            </button>
          </div>
        )}
        
        {view === 'setup' ? (
          <div className="loop-setup">
            <ParticipantsList loopId={currentLoop.id} />
            <LoopControls loopId={currentLoop.id} />
          </div>
        ) : (
          <div className="loop-chat">
            <div className="messages-container">
              <LoopMessageList loop={currentLoop} />
            </div>
            <div className="loop-status-bar">
              <div className="status-indicator">
                <div className={`status-dot ${currentLoop.status}`}></div>
                <span className="status-text">
                  {currentLoop.status === 'running' ? 'Loop is running...' : 
                   currentLoop.status === 'paused' ? 'Loop is paused' : 'Loop is stopped'}
                </span>
              </div>
              <div className="loop-controls-compact">
                {currentLoop.status === 'running' && (
                  <button 
                    className="compact-button pause"
                    onClick={handlePauseLoop}
                  >
                    Pause
                  </button>
                )}
                {currentLoop.status === 'paused' && (
                  <button 
                    className="compact-button resume"
                    onClick={handleResumeLoop}
                  >
                    Resume
                  </button>
                )}
                {(currentLoop.status === 'running' || currentLoop.status === 'paused') && (
                  <button 
                    className="compact-button stop"
                    onClick={handleStopLoop}
                  >
                    Stop
                  </button>
                )}
                {currentLoop.status === 'stopped' && (
                  <button 
                    className="compact-button reset"
                    onClick={handleResetLoop}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoopPage;