import React, { useState, useEffect } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import { useModel } from '../../contexts/ModelContext';
import ParticipantItem from './ParticipantItem';
import './ParticipantsList.css';

// 개선된 버전 - 모델 파라미터 연동
const ParticipantsList = ({ loopId, systemPrompts }) => {
  const { 
    currentLoop, 
    updateLoopParticipant, 
    removeLoopParticipant,
    reorderLoopParticipants,
    addNewParticipant
  } = useLoop();
  
  const { currentModel, modelConfigs } = useModel();
  const [modelParams, setModelParams] = useState(null);

  // 모델 파라미터가 변경되면 저장
  useEffect(() => {
    if (modelParams) {
      console.log('모델 파라미터 업데이트됨:', modelParams);
      // 필요한 경우 여기서 추가 작업 수행
    }
  }, [modelParams]);

  // 모델 파라미터 변경 처리
  const handleModelParamsChange = (params) => {
    setModelParams(params);
  };

  // Simplified version without drag and drop
  const moveParticipantUp = (index) => {
    if (index <= 0) return; // Already at the top
    
    // Get all participant IDs in current order
    const participantIds = currentLoop.participants
      .sort((a, b) => a.order_index - b.order_index)
      .map(p => p.id);
    
    // Swap with previous item
    [participantIds[index], participantIds[index-1]] = [participantIds[index-1], participantIds[index]];
    
    // Update order on the server
    reorderLoopParticipants(loopId, participantIds);
  };
  
  const moveParticipantDown = (index) => {
    if (!currentLoop || !currentLoop.participants || 
        index >= currentLoop.participants.length - 1) return; // Already at the bottom
    
    // Get all participant IDs in current order
    const participantIds = currentLoop.participants
      .sort((a, b) => a.order_index - b.order_index)
      .map(p => p.id);
    
    // Swap with next item
    [participantIds[index], participantIds[index+1]] = [participantIds[index+1], participantIds[index]];
    
    // Update order on the server
    reorderLoopParticipants(loopId, participantIds);
  };

  const handleUpdateParticipant = (participantId, updates) => {
    // 모델이 변경된 경우, 해당 모델의 기본 파라미터 적용
    if (updates.model && modelParams && updates.model === modelParams.model) {
      // 모델 파라미터 설정에서 가져온 값 사용
      const modelConfig = {
        ...updates,
        temperature: modelParams.temperature,
        max_tokens: modelParams.maxTokens
      };
      
      // O3 모델인 경우 reasoning_effort 추가
      if (modelConfigs[updates.model]?.category === 'o3') {
        modelConfig.reasoning_effort = modelParams.reasoningEffort;
      }
      
      updateLoopParticipant(loopId, participantId, modelConfig);
    } else {
      // 일반 업데이트
      updateLoopParticipant(loopId, participantId, updates);
    }
  };

  const handleRemoveParticipant = (participantId) => {
    removeLoopParticipant(loopId, participantId);
  };

  const handleAddParticipant = () => {
    // 현재 설정된 모델 파라미터가 있으면 해당 값으로 추가
    if (modelParams) {
      const model = modelParams.model || currentModel || 'gpt-4o';
      const systemPrompt = '';
      const displayName = 'AI ' + (currentLoop?.participants.length + 1);
      
      // 모델 파라미터 설정에서 가져온 값을 사용하여 참여자 추가
      addNewParticipant(loopId, model, systemPrompt, displayName).then(result => {
        if (result && result.participant) {
          const participantId = result.participant.id;
          
          // 파라미터 값도 함께 업데이트
          const updates = {
            temperature: modelParams.temperature,
            max_tokens: modelParams.maxTokens
          };
          
          // O3 모델인 경우 reasoning_effort 추가
          if (modelConfigs[model]?.category === 'o3') {
            updates.reasoning_effort = modelParams.reasoningEffort;
          }
          
          updateLoopParticipant(loopId, participantId, updates);
        }
      });
    } else {
      // 기본값으로 참여자 추가
      addNewParticipant(loopId, currentModel || 'gpt-4o');
    }
  };

  // If loop status is running or paused, disable editing
  const isLocked = currentLoop && ['running', 'paused'].includes(currentLoop.status);

  return (
    <div className="participants-list">
      <div className="participants-list-header">
        <h3>AI Participants</h3>
        <button 
          className="add-participant-button"
          onClick={handleAddParticipant}
          disabled={isLocked}
        >
          Add Participant
        </button>
      </div>
      
      {currentLoop?.participants.length === 0 ? (
        <div className="no-participants">
          <p>No participants added yet. Click "Add Participant" to add an AI to the loop.</p>
        </div>
      ) : (
        <div className="participants-container">
          {currentLoop?.participants
            .sort((a, b) => a.order_index - b.order_index)
            .map((participant, index) => (
              <ParticipantItem 
                key={participant.id}
                participant={participant}
                index={index}
                loopId={loopId}
                onUpdate={handleUpdateParticipant}
                onRemove={handleRemoveParticipant}
                onMoveUp={() => moveParticipantUp(index)}
                onMoveDown={() => moveParticipantDown(index)}
                systemPrompts={systemPrompts}
                modelParams={modelParams}
              />
            ))
          }
        </div>
      )}

      {isLocked && (
        <div className="participants-locked-notice">
          <p>The loop is currently {currentLoop.status}. Stop the loop to modify participants.</p>
        </div>
      )}
      
      {currentLoop?.participants.length > 0 && (
        <div className="participants-help">
          <p>
            <strong>Loop Order:</strong> Use the up/down arrows to reorder participants. 
            The conversation will flow in sequence from top to bottom.
          </p>
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;