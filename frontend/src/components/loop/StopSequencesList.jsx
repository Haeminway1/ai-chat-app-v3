import React, { useState } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import StopSequence from './StopSequence';
import { FiPlus, FiInfo } from 'react-icons/fi';
import './StopSequencesList.css';

const StopSequencesList = ({ loopId }) => {
  const { currentLoop, addStopSequence, updateStopSequence, removeStopSequence, reorderLoopStopSequences } = useLoop();
  const [expandedSequence, setExpandedSequence] = useState(null);

  const handleAddStopSequence = () => {
    const sequenceCount = currentLoop?.stop_sequences?.length || 0;
    const displayName = `Stop Sequence ${sequenceCount + 1}`;
    addStopSequence(
      loopId,
      "gpt-4o", 
      "", 
      displayName,
      ""
    );
  };

  const toggleExpand = (id) => {
    setExpandedSequence(expandedSequence === id ? null : id);
  };
  
  const handleMoveUp = (index) => {
    if (!currentLoop || !currentLoop.stop_sequences || index <= 0) return;
    
    const newOrder = [...currentLoop.stop_sequences];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    
    const stopSequenceIds = newOrder.map(s => s.id);
    reorderLoopStopSequences(loopId, stopSequenceIds);
  };
  
  const handleMoveDown = (index) => {
    if (!currentLoop || !currentLoop.stop_sequences || index >= currentLoop.stop_sequences.length - 1) return;
    
    const newOrder = [...currentLoop.stop_sequences];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    const stopSequenceIds = newOrder.map(s => s.id);
    reorderLoopStopSequences(loopId, stopSequenceIds);
  };
  
  const handleUpdateStopSequence = (stopSequenceId, updates) => {
    updateStopSequence(loopId, stopSequenceId, updates);
  };
  
  const handleRemoveStopSequence = (stopSequenceId) => {
    removeStopSequence(loopId, stopSequenceId);
  };

  if (!currentLoop) return null;

  return (
    <div className={`stop-sequences-list ${expandedSequence ? 'with-expanded' : ''}`}>
      <div className="stop-sequences-header">
        <h2 className="stop-sequences-title">Stop Sequences</h2>
        <button 
          className="add-stop-sequence-button"
          onClick={handleAddStopSequence}
        >
          <FiPlus /> Add Stop Sequence
        </button>
      </div>
      
      {currentLoop.stop_sequences && currentLoop.stop_sequences.length > 0 ? (
        <div className="stop-sequences-items">
          {currentLoop.stop_sequences.map((sequence, index) => (
            <StopSequence 
              key={sequence.id || index}
              sequence={sequence}
              index={index}
              loopId={loopId}
              isExpanded={expandedSequence === sequence.id}
              onToggleExpand={() => toggleExpand(sequence.id)}
              onUpdate={(updates) => handleUpdateStopSequence(sequence.id, updates)}
              onRemove={() => handleRemoveStopSequence(sequence.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === currentLoop.stop_sequences.length - 1}
              isEditable={currentLoop.status !== 'running' && currentLoop.status !== 'paused'}
              totalStopSequences={currentLoop.stop_sequences.length}
            />
          ))}
        </div>
      ) : (
        <div className="stop-sequences-empty">
          <p>No stop sequences added yet. Stop sequences tell the loop when to end.</p>
          <button 
            className="add-stop-sequence-button"
            onClick={handleAddStopSequence}
          >
            <FiPlus /> Add Your First Stop Sequence
          </button>
        </div>
      )}
      
      <div className="stop-sequences-help">
        <p><FiInfo style={{marginRight: '8px'}} /> Stop sequences define when the loop should terminate. For example, adding a sequence like "THE END" will stop the loop when any participant outputs that text.</p>
      </div>
    </div>
  );
};

export default StopSequencesList; 