import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoop } from '../contexts/LoopContext';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import LoopHeader from '../components/loop/LoopHeader';
import ParticipantsList from '../components/loop/ParticipantsList';
import StopSequencesList from '../components/loop/StopSequencesList';
import LoopControls from '../components/loop/LoopControls';
import LoopMessageList from '../components/loop/LoopMessageList';
import './LoopPage.css';

// Store view by loop ID
const loopStateByID = {};

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
  
  const { currentModel } = useModel();
  const { systemPrompts } = useSettings();

  const [loadFailed, setLoadFailed] = useState(false);
  const [loadTried, setLoadTried] = useState(false);
  const [view, setView] = useState('setup'); // Default to 'setup' instead of 'chat'
  
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
              // If there is a saved view, use it, otherwise use setup as default
              if (loopStateByID[loopId]?.view) {
                setView(loopStateByID[loopId].view);
              } else {
                // Only switch to messages if running and has messages
                if (result.status === 'running' && result.messages && result.messages.length > 0) {
                  setView('chat');
                } else {
                  setView('setup');
                }
              }
            }
          })
          .catch(() => {
            setLoadFailed(true);
          });
      }
    }
  }, [loopId, loadLoop, loadTried, currentLoop]);

  // Save state when view changes
  useEffect(() => {
    if (loopId && view) {
      if (!loopStateByID[loopId]) {
        loopStateByID[loopId] = {};
      }
      loopStateByID[loopId].view = view;
    }
  }, [loopId, view]);

  // Effect to automatically switch to messages view when loop is running
  useEffect(() => {
    if (currentLoop?.status === 'running' && view !== 'chat') {
      setView('chat');
    }
  }, [currentLoop?.status, view]);

  // Real-time chat message updates polling (when loop is running)
  useEffect(() => {
    let pollInterval = null;
    
    if (currentLoop?.status === 'running' && loopId) {
      // Poll more frequently to get real-time updates (every 500ms)
      pollInterval = setInterval(() => {
        loadLoop(loopId);
      }, 500);
    } else if (currentLoop?.status === 'paused' && loopId) {
      // Poll less frequently when paused
      pollInterval = setInterval(() => {
        loadLoop(loopId);
      }, 2000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentLoop?.status, loopId, loadLoop]);

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
    // After resetting the loop, go to setup view
    setView('setup');
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
      {/* Spacer to prevent content overlap with navigation */}
      <div className="header-spacer"></div>

      <div className="loop-container">
        <LoopHeader 
          loop={currentLoop} 
          onTitleChange={handleUpdateLoopTitle}
        />
        
        {/* Navigation tabs */}
        <div className="loop-navigation">
          <button 
            className={`loop-nav-button ${view === 'setup' ? 'active' : ''}`} 
            onClick={() => setView('setup')}
          >
            Setup
          </button>
          <button 
            className={`loop-nav-button ${view === 'chat' ? 'active' : ''}`} 
            onClick={() => setView('chat')}
          >
            Messages
          </button>
        </div>
        
        {view === 'setup' ? (
          <div className="loop-setup">
            {/* Participants list with enhanced model parameters */}
            <ParticipantsList 
              loopId={currentLoop.id} 
              systemPrompts={systemPrompts}
            />
            
            {/* Stop Sequences List */}
            <StopSequencesList 
              loopId={currentLoop.id}
            />
            
            {/* Loop start controls */}
            <LoopControls loopId={currentLoop.id} />
          </div>
        ) : (
          <div className="loop-chat">
            <div className="messages-container">
              {currentLoop?.messages && currentLoop.messages.length > 0 ? (
                <LoopMessageList 
                  key={`message-list-${currentLoop.id}-${currentLoop.messages.length}`} 
                  messages={currentLoop.messages} 
                  participants={currentLoop.participants} 
                />
              ) : (
                <div className="empty-messages">
                  <p>This loop has no messages yet. Configure participants and start the loop to begin the conversation.</p>
                </div>
              )}
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
                {currentLoop.status === 'stopped' && currentLoop.messages && currentLoop.messages.length > 0 && (
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