import React from 'react';
import { FaPlus } from 'react-icons/fa';
import { useLoop } from '../../contexts/LoopContext';
import ParticipantItem from './ParticipantItem';
import './ParticipantsList.css';

const ParticipantsList = () => {
  const { 
    currentLoop, 
    addParticipant, 
    moveParticipantUp, 
    moveParticipantDown, 
    updateParticipant, 
    removeParticipant,
    isLoopRunning,
    isLoopPaused
  } = useLoop();

  const handleAddParticipant = () => {
    addParticipant();
  };

  const isParticipantsEditable = !isLoopRunning && !isLoopPaused;

  return (
    <div className="participants-list">
      <div className="participants-header">
        <h3 className="participants-title">Participants</h3>
        <button 
          className="add-participant-button" 
          onClick={handleAddParticipant}
          disabled={!isParticipantsEditable}
        >
          <FaPlus /> Add Participant
        </button>
      </div>

      {(!currentLoop?.participants || currentLoop.participants.length === 0) ? (
        <div className="participants-empty">
          <p>No participants added yet. Start by adding a participant to your loop.</p>
        </div>
      ) : (
        <div className="participants-items">
          {currentLoop.participants.map((participant, index) => (
            <ParticipantItem
              key={participant.id}
              participant={participant}
              index={index}
              isFirst={index === 0}
              isLast={index === currentLoop.participants.length - 1}
              onMoveUp={() => moveParticipantUp(index)}
              onMoveDown={() => moveParticipantDown(index)}
              onUpdate={(updatedParticipant) => updateParticipant(index, updatedParticipant)}
              onRemove={() => removeParticipant(index)}
              isEditable={isParticipantsEditable}
              totalParticipants={currentLoop.participants.length}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;