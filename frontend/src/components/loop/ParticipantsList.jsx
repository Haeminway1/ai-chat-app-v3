import React, { useState } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import Participant from './Participant';
import { FiPlus, FiInfo } from 'react-icons/fi';
import './ParticipantsList.css';

const ParticipantsList = () => {
  const { currentLoop, addParticipant } = useLoop();
  const [expandedParticipant, setExpandedParticipant] = useState(null);

  const handleAddParticipant = () => {
    const participantCount = currentLoop?.participants?.length || 0;
    addParticipant({
      name: `Participant ${participantCount + 1}`,
      model: "gpt-4o",
      role: "assistant",
      systemPrompt: "",
      temperature: 0.7,
      maxTokens: 4000
    });
  };

  const toggleExpand = (id) => {
    setExpandedParticipant(expandedParticipant === id ? null : id);
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
              isExpanded={expandedParticipant === participant.id}
              onToggleExpand={() => toggleExpand(participant.id)}
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