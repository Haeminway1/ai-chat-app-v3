import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useLoop } from '../../contexts/LoopContext';
import './StopSequence.css';

const StopSequence = ({ sequence, index, isExpanded, onToggleExpand }) => {
  const { updateStopSequence, removeStopSequence } = useLoop();
  
  const [value, setValue] = useState(sequence.value || "");
  
  useEffect(() => {
    setValue(sequence.value || "");
  }, [sequence]);
  
  const handleSave = () => {
    updateStopSequence(index, {
      ...sequence,
      value
    });
  };
  
  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove this stop sequence?`)) {
      removeStopSequence(index);
    }
  };
  
  return (
    <div className={`stop-sequence ${isExpanded ? 'expanded' : ''}`}>
      <div className="stop-sequence-header" onClick={onToggleExpand}>
        <div className="stop-sequence-number">{index + 1}</div>
        <div className="stop-sequence-value">
          {value ? value.substring(0, 30) + (value.length > 30 ? "..." : "") : "Empty sequence"}
        </div>
        <div className="stop-sequence-actions">
          <button 
            className="remove-stop-sequence" 
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
          >
            <FiX />
          </button>
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="stop-sequence-details">
          <div className="form-group">
            <label>Stop Sequence</label>
            <textarea 
              rows="3"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleSave}
              className="form-control"
              placeholder="Enter text that will cause the loop to stop when found in any participant's response..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StopSequence; 