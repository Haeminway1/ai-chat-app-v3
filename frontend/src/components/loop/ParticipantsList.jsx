import React, { useState } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import Participant from './Participant';
import { FiPlus, FiInfo } from 'react-icons/fi';
import './ParticipantsList.css';

const ParticipantsList = ({ loopId, systemPrompts }) => {
  const { currentLoop, addParticipant, updateLoopParticipant, removeLoopParticipant, reorderLoopParticipants } = useLoop();
  const [expandedParticipant, setExpandedParticipant] = useState(null);

  const handleAddParticipant = () => {
    const participantCount = currentLoop?.participants?.length || 0;
    const displayName = `Participant ${participantCount + 1}`;
    addParticipant(
      loopId,
      "gpt-4o", 
      "", 
      displayName, 
      ""
    );
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
    reorderLoopParticipants(loopId, participantIds);
  };
  
  const handleMoveDown = (index) => {
    if (!currentLoop || !currentLoop.participants || index >= currentLoop.participants.length - 1) return;
    
    const newOrder = [...currentLoop.participants];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    const participantIds = newOrder.map(p => p.id);
    reorderLoopParticipants(loopId, participantIds);
  };
  
  const handleUpdateParticipant = (participantId, updates) => {
    updateLoopParticipant(loopId, participantId, updates);
  };
  
  const handleRemoveParticipant = (participantId) => {
    removeLoopParticipant(loopId, participantId);
  };

  if (!currentLoop) return null;

  return (
    <div className={`participants-list ${expandedParticipant ? 'with-expanded' : ''}`}>
      <div className="participants-header">
        <h2 className="participants-title">Participants</h2>
        <button 
          className="add-participant-button"
          onClick={handleAddParticipant}
        >
          <FiPlus /> Add Participant
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
              isEditable={currentLoop.status !== 'running' && currentLoop.status !== 'paused'}
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
          >
            <FiPlus /> Add Your First Participant
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;