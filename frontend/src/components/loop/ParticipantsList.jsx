import React, { useState, useEffect } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import Participant from './Participant';
import { FiPlus } from 'react-icons/fi';
import './ParticipantsList.css';

const ParticipantsList = ({ loopId }) => {
  const { 
    currentLoop, 
    addParticipant, 
    updateLoopParticipant, 
    removeLoopParticipant, 
    reorderParticipants 
  } = useLoop();
  const [expandedParticipant, setExpandedParticipant] = useState(null);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  
  // Add useEffect to handle escape key for closing expanded panels
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && expandedParticipant) {
        setExpandedParticipant(null);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [expandedParticipant]);

  const handleAddParticipant = () => {
    if (isAddingParticipant) return; // 이미 추가 중이면 중복 요청 방지
    
    setIsAddingParticipant(true);
    const participantCount = currentLoop?.participants?.length || 0;
    const displayName = `Participant ${participantCount + 1}`;
    
    addParticipant(
      loopId,
      "gpt-4o", 
      "", 
      displayName, 
      "",
      0.7,  // default temperature
      4000  // default max_tokens
    ).finally(() => {
      // 작업이 완료되면 상태 복원
      setIsAddingParticipant(false);
    });
  };

  const toggleExpand = (id) => {
    setExpandedParticipant(expandedParticipant === id ? null : id);
  };
  
  const handleMoveUp = (index) => {
    if (!currentLoop || !currentLoop.participants || index <= 0) return;
    
    const newOrder = [...currentLoop.participants];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    
    const participantIds = newOrder.map(p => p.id);
    reorderParticipants(loopId, participantIds);
  };
  
  const handleMoveDown = (index) => {
    if (!currentLoop || !currentLoop.participants || index >= currentLoop.participants.length - 1) return;
    
    const newOrder = [...currentLoop.participants];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    const participantIds = newOrder.map(p => p.id);
    reorderParticipants(loopId, participantIds);
  };
  
  const handleUpdateParticipant = (participantId, updates) => {
    if (!participantId || !updates) return;
    return updateLoopParticipant(loopId, participantId, updates);
  };
  
  const handleRemoveParticipant = (participantId) => {
    if (!participantId) return;
    
    // 제거 후 해당 참가자가 확장되어 있었다면 닫기
    if (expandedParticipant === participantId) {
      setExpandedParticipant(null);
    }
    
    removeLoopParticipant(loopId, participantId);
  };

  if (!currentLoop) return null;
  
  const isEditable = currentLoop.status !== 'running' && currentLoop.status !== 'paused';

  return (
    <div className={`participants-list ${expandedParticipant ? 'with-expanded' : ''}`}>
      <div className="participants-header">
        <h2 className="participants-title">Participants</h2>
        <button 
          className="add-participant-button"
          onClick={handleAddParticipant}
          disabled={!isEditable || isAddingParticipant}
        >
          <FiPlus /> {isAddingParticipant ? 'Adding...' : 'Add Participant'}
        </button>
      </div>
      
      {currentLoop.participants && currentLoop.participants.length > 0 ? (
        <div className="participants-items">
          {currentLoop.participants.map((participant, index) => (
            <Participant 
              key={participant.id || index}
              participant={participant}
              index={index}
              loopId={loopId}
              isExpanded={expandedParticipant === participant.id}
              onToggleExpand={() => toggleExpand(participant.id)}
              onUpdate={(updates) => handleUpdateParticipant(participant.id, updates)}
              onRemove={() => handleRemoveParticipant(participant.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === currentLoop.participants.length - 1}
              isEditable={isEditable}
              totalParticipants={currentLoop.participants.length}
            />
          ))}
        </div>
      ) : (
        <div className="participants-empty">
          <p>No participants added yet. Add at least one participant to start the loop.</p>
          <button 
            className="add-participant-button"
            onClick={handleAddParticipant}
            disabled={!isEditable || isAddingParticipant}
          >
            <FiPlus /> {isAddingParticipant ? 'Adding...' : 'Add Your First Participant'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;