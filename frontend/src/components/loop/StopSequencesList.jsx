import React from 'react';
import { FaPlus } from 'react-icons/fa';
import { useLoop } from '../../contexts/LoopContext';
import StopSequenceItem from './StopSequenceItem';
import './StopSequencesList.css';

const StopSequencesList = () => {
  const { 
    currentLoop, 
    addStopSequence, 
    moveStopSequenceUp, 
    moveStopSequenceDown, 
    updateStopSequence, 
    removeStopSequence,
    isLoopRunning,
    isLoopPaused
  } = useLoop();

  const handleAddStopSequence = () => {
    addStopSequence();
  };

  const isStopSequencesEditable = !isLoopRunning && !isLoopPaused;

  return (
    <div className="stop-sequences-list">
      <div className="stop-sequences-header">
        <h3 className="stop-sequences-title">Stop Sequences</h3>
        <button 
          className="add-stop-sequence-button" 
          onClick={handleAddStopSequence}
          disabled={!isStopSequencesEditable}
        >
          <FaPlus /> Add Stop Sequence
        </button>
      </div>

      {(!currentLoop?.stop_sequences || currentLoop.stop_sequences.length === 0) ? (
        <div className="stop-sequences-empty">
          <p>No stop sequences added yet. Add a stop sequence to automatically stop the loop based on specific conditions.</p>
        </div>
      ) : (
        <div className="stop-sequences-items">
          {currentLoop.stop_sequences.map((stopSequence, index) => (
            <StopSequenceItem
              key={stopSequence.id}
              stopSequence={stopSequence}
              index={index}
              isFirst={index === 0}
              isLast={index === currentLoop.stop_sequences.length - 1}
              onMoveUp={() => moveStopSequenceUp(index)}
              onMoveDown={() => moveStopSequenceDown(index)}
              onUpdate={(updatedStopSequence) => updateStopSequence(index, updatedStopSequence)}
              onRemove={() => removeStopSequence(index)}
              isEditable={isStopSequencesEditable}
              totalStopSequences={currentLoop.stop_sequences.length}
            />
          ))}
        </div>
      )}
      
      <div className="stop-sequences-help">
        <p>Stop sequences will monitor the entire conversation and determine if the loop should be stopped based on defined conditions, evaluating the complete context and flow of the discussion.</p>
      </div>
    </div>
  );
};

export default StopSequencesList; 