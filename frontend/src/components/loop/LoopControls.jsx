import React, { useState, useEffect } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import './LoopControls.css';

// 루프 프롬프트 관리를 위한 유틸리티 함수들
const loopPromptUtils = {
  // 특정 루프의 프롬프트 저장
  savePrompt: (loopId, prompt) => {
    if (!loopId) return;
    localStorage.setItem(`loop_prompt_${loopId}`, prompt || '');
  },
  
  // 특정 루프의 프롬프트 로드
  loadPrompt: (loopId) => {
    if (!loopId) return '';
    return localStorage.getItem(`loop_prompt_${loopId}`) || '';
  },
  
  // 특정 루프의 프롬프트 삭제
  clearPrompt: (loopId) => {
    if (!loopId) return;
    localStorage.removeItem(`loop_prompt_${loopId}`);
  },
  
  // 디버깅용 - 모든 루프 프롬프트 키 출력
  debugPrompts: () => {
    console.group('저장된 루프 프롬프트 (디버깅)');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('loop_prompt_')) {
        console.log(`${key}: ${localStorage.getItem(key)}`);
      }
    }
    console.groupEnd();
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
  
  // loopId가 확실히 있을 때만 초기화하도록 수정
  const [initialPrompt, setInitialPrompt] = useState('');
  const [error, setError] = useState('');
  
  // 명확한 의존성과 초기화 로직
  useEffect(() => {
    if (loopId) {
      console.log(`루프 ${loopId} 프롬프트 로드 중...`);
      const savedPrompt = loopPromptUtils.loadPrompt(loopId);
      setInitialPrompt(savedPrompt);
      
      // 디버깅용 - 모든 저장된 프롬프트 확인
      loopPromptUtils.debugPrompts();
    }
  }, [loopId]); // loopId가 변경될 때만 실행
  
  // 프롬프트 변경 시가 아닌, 사용자가 의도적으로 저장할 때만 저장하도록 변경
  const handlePromptChange = (e) => {
    const newPrompt = e.target.value;
    setInitialPrompt(newPrompt);
    
    // 에러 메시지 제거
    if (newPrompt.trim()) setError('');
    
    // 입력할 때마다 저장하지 않음 - 시작할 때 저장하도록 변경
  };
  
  const handleStart = () => {
    if (!initialPrompt.trim()) {
      setError('Please enter an initial prompt to start the loop.');
      return;
    }
    
    // 참가자 확인
    if (!currentLoop?.participants.length) {
      setError('Please add at least one participant to start the loop.');
      return;
    }
    
    // 에러 없음
    setError('');
    
    // 루프 시작 시에만 프롬프트 저장
    loopPromptUtils.savePrompt(loopId, initialPrompt);
    console.log(`루프 ${loopId} 프롬프트 저장됨: ${initialPrompt.substring(0, 20)}...`);
    
    // 루프 시작
    startLoopWithPrompt(loopId, initialPrompt);
  };
  
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset this loop? All messages will be deleted.')) {
      resetCurrentLoop();
      // 프롬프트는 유지 (삭제하지 않음)
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
              onChange={handlePromptChange}
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