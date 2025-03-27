import React, { useState } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import StopSequence from './StopSequence';
import { FiPlus, FiInfo } from 'react-icons/fi';
import './StopSequencesList.css';

const StopSequencesList = () => {
  const { currentLoop, addStopSequence } = useLoop();
  const [expandedSequence, setExpandedSequence] = useState(null);

  const handleAddStopSequence = () => {
    addStopSequence("");
  };

  const toggleExpand = (id) => {
    setExpandedSequence(expandedSequence === id ? null : id);
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
      
      {currentLoop.stopSequences && currentLoop.stopSequences.length > 0 ? (
        <div className="stop-sequences-items">
          {currentLoop.stopSequences.map((sequence, index) => (
            <StopSequence 
              key={sequence.id || index}
              sequence={sequence}
              index={index}
              isExpanded={expandedSequence === sequence.id}
              onToggleExpand={() => toggleExpand(sequence.id)}
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