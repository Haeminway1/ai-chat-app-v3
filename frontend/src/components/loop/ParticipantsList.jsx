import React, { useState } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import { useModel } from '../../contexts/ModelContext';
import ParticipantItem from './ParticipantItem';
import './ParticipantsList.css';

const ParticipantsList = ({ loopId, systemPrompts }) => {
  const { 
    currentLoop, 
    updateLoopParticipant, 
    removeLoopParticipant,
    reorderLoopParticipants,
    addNewParticipant
  } = useLoop();
  
  const { currentModel, modelConfigs } = useModel();

  const handleUpdateParticipant = (participantId, updates) => {
    updateLoopParticipant(loopId, participantId, updates);
  };

  const handleRemoveParticipant = (participantId) => {
    removeLoopParticipant(loopId, participantId);
  };

  const handleAddParticipant = () => {
    // Add a new participant with default model
    const model = currentModel || 'gpt-4o';
    const systemPrompt = '';
    const displayName = 'AI ' + (currentLoop?.participants.length + 1);
    
    addNewParticipant(loopId, model, systemPrompt, displayName);
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