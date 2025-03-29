import React, { useState, useEffect } from 'react';
import { useLoop } from '../../contexts/LoopContext';
import StopSequence from './StopSequence';
import { FiPlus, FiInfo } from 'react-icons/fi';
import './StopSequencesList.css';

const StopSequencesList = ({ loopId }) => {
  const { 
    currentLoop, 
    addStopSequence, 
    updateStopSequence, 
    removeStopSequence, 
    reorderStopSequences 
  } = useLoop();
  const [expandedSequence, setExpandedSequence] = useState(null);
  const [isAddingSequence, setIsAddingSequence] = useState(false);
  
  // Add useEffect to handle escape key for closing expanded panels
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && expandedSequence) {
        setExpandedSequence(null);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [expandedSequence]);

  const handleAddStopSequence = () => {
    if (isAddingSequence) return; // 이미 추가 중이면 중복 요청 방지
    
    setIsAddingSequence(true);
    const sequenceCount = currentLoop?.stop_sequences?.length || 0;
    const displayName = `Stop Sequence ${sequenceCount + 1}`;
    
    addStopSequence(
      loopId,
      "gpt-4o", 
      "", 
      displayName,
      ""
    ).finally(() => {
      // 작업이 완료되면 상태 복원
      setIsAddingSequence(false);
    });
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
    reorderStopSequences(loopId, stopSequenceIds);
  };
  
  const handleMoveDown = (index) => {
    if (!currentLoop || !currentLoop.stop_sequences || index >= currentLoop.stop_sequences.length - 1) return;
    
    const newOrder = [...currentLoop.stop_sequences];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    const stopSequenceIds = newOrder.map(s => s.id);
    reorderStopSequences(loopId, stopSequenceIds);
  };
  
  const handleUpdateStopSequence = (stopSequenceId, updates) => {
    if (!stopSequenceId || !updates) return;
    return updateStopSequence(loopId, stopSequenceId, updates);
  };
  
  const handleRemoveStopSequence = (stopSequenceId) => {
    if (!stopSequenceId) return;
    
    // 제거 후 해당 시퀀스가 확장되어 있었다면 닫기
    if (expandedSequence === stopSequenceId) {
      setExpandedSequence(null);
    }
    
    removeStopSequence(loopId, stopSequenceId);
  };

  if (!currentLoop) return null;
  
  const isEditable = currentLoop.status !== 'running' && currentLoop.status !== 'paused';

  return (
    <div className={`stop-sequences-list ${expandedSequence ? 'with-expanded' : ''}`}>
      <div className="stop-sequences-header">
        <h2 className="stop-sequences-title">Stop Sequences</h2>
        <button 
          className="add-stop-sequence-button"
          onClick={handleAddStopSequence}
          disabled={!isEditable || isAddingSequence}
        >
          <FiPlus /> {isAddingSequence ? 'Adding...' : 'Add Stop Sequence'}
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
              isEditable={isEditable}
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
            disabled={!isEditable || isAddingSequence}
          >
            <FiPlus /> {isAddingSequence ? 'Adding...' : 'Add Your First Stop Sequence'}
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