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
  
  // Add state to track if any modals are open
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

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
              // 루프가 로드되면 먼저 루프가 유효한지 확인
              const isValidLoop = result.id && result.title;
              
              if (isValidLoop) {
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
              } else {
                // 유효하지 않은 루프인 경우 오류 상태로 설정
                setLoadFailed(true);
              }
            }
          })
          .catch(() => {
            setLoadFailed(true);
          });
      }
    }
  }, [loopId, loadLoop, loadTried, currentLoop]);

  // Save state when view changes - 성능 최적화를 위한 디바운스 적용
  useEffect(() => {
    if (loopId && view) {
      if (!loopStateByID[loopId]) {
        loopStateByID[loopId] = {};
      }
      
      // 불필요한 업데이트 방지를 위한 추가 조건 확인
      if (loopStateByID[loopId].view !== view) {
        loopStateByID[loopId].view = view;
      }
    }
  }, [loopId, view]);

  // Effect to automatically switch to messages view when loop is running
  useEffect(() => {
    if (currentLoop?.status === 'running' && view !== 'chat') {
      // 즉시 상태를 업데이트하면 깜빡거림이 발생할 수 있으므로 약간 지연
      setTimeout(() => {
        setView('chat');
      }, 10);
    }
  }, [currentLoop?.status, view]);

  // Real-time chat message updates polling (when loop is running)
  useEffect(() => {
    let pollInterval = null;
    
    // Function to safely load the loop data
    const fetchLoopData = async () => {
      try {
        await loadLoop(loopId);
      } catch (error) {
        console.error("Error polling loop data:", error);
      }
    };
    
    if (currentLoop?.status === 'running' && loopId) {
      // Poll more frequently to get real-time updates (every 1000ms to reduce server load)
      pollInterval = setInterval(fetchLoopData, 1000);
      
      // Initial fetch
      fetchLoopData();
    } else if (currentLoop?.status === 'paused' && loopId) {
      // Poll less frequently when paused
      pollInterval = setInterval(fetchLoopData, 3000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentLoop?.status, loopId, loadLoop]);

  // Update the LoopPage component to include an effect that prevents body scrolling when modals are open
  useEffect(() => {
    const handleModalStateChange = (e) => {
      if (e.detail && e.detail.type === 'modal_state_changed') {
        setIsAnyModalOpen(e.detail.isOpen);
      }
    };

    window.addEventListener('modal_state_changed', handleModalStateChange);

    return () => {
      window.removeEventListener('modal_state_changed', handleModalStateChange);
    };
  }, []);

  // Apply body style to prevent scrolling when modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

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
          <div className="loop-setup loop-content-area">
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
          <div className="loop-chat loop-content-area">
            <div className="messages-container">
              {currentLoop?.messages && currentLoop.messages.length > 0 ? (
                <LoopMessageList 
                  messages={currentLoop.messages} 
                  participants={currentLoop.participants} 
                  className="message-list-container"
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
        )}
      </div>
    </div>
  );
};

export default LoopPage;