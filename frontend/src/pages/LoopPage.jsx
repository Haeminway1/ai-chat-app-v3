import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoop } from '../contexts/LoopContext';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import LoopHeader from '../components/loop/LoopHeader';
import ParticipantsList from '../components/loop/ParticipantsList';
import LoopControls from '../components/loop/LoopControls';
import LoopMessageList from '../components/loop/LoopMessageList';
import LoopParametersPanel from '../components/loop/LoopParametersPanel';
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
  
  const { currentModel, modelConfigs } = useModel();
  const { systemPrompts } = useSettings();

  const [loadFailed, setLoadFailed] = useState(false);
  const [loadTried, setLoadTried] = useState(false);
  const [view, setView] = useState('chat'); // 'setup' or 'chat'
  const [modelParams, setModelParams] = useState(null);
  
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
              // 이미 메시지가 있으면 채팅 뷰로 이동, 없으면 설정 뷰로 이동
              if (result.messages && result.messages.length > 0) {
                setView('chat');
              } else {
                setView('setup');
              }
            }
          })
          .catch(() => {
            setLoadFailed(true);
          });
      }
    }
  }, [loopId, loadLoop, loadTried, currentLoop]);

  // 실시간 채팅 메시지 업데이트를 위한 폴링 (루프가 실행 중일 때)
  useEffect(() => {
    let pollInterval = null;
    
    if (currentLoop?.status === 'running' && loopId) {
      // 2초마다 루프 정보 새로 가져오기
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
    // 루프를 리셋한 후 setup 뷰로 이동
    setView('setup');
  };
  
  // 설정 버튼 클릭 처리
  const handleSettingsClick = () => {
    navigate('/settings', { state: { from: `/loop/${loopId}` } });
  };
  
  // 모델 파라미터 변경 처리
  const handleModelParamsChange = (params) => {
    setModelParams(params);
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
          onSettingsClick={handleSettingsClick}
        />
        
        {/* 항상 뷰 토글 버튼 표시 */}
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
        
        {view === 'setup' ? (
          <div className="loop-setup">
            <ParticipantsList 
              loopId={currentLoop.id} 
              systemPrompts={systemPrompts}
            />
            
            {/* 모델 파라미터 패널 */}
            <LoopParametersPanel 
              currentModel={currentModel}
              modelConfigs={modelConfigs}
              onModelParametersChange={handleModelParamsChange}
            />
            
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