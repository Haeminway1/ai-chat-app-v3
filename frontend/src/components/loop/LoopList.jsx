import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoop } from '../../contexts/LoopContext';
import './LoopList.css';

const LoopList = () => {
  const navigate = useNavigate();
  const { loopId } = useParams();
  const { 
    loops, 
    loading, 
    loadLoops, 
    removeLoop, 
    loopsLoaded,
    loadLoop,
    currentLoop
  } = useLoop();

  // Load loop list on initial render if not already loaded
  useEffect(() => {
    if (!loopsLoaded) {
      loadLoops(true); // Force reload to ensure fresh data
    }
  }, [loopsLoaded, loadLoops]);

  // Ensure current loop is synchronized with URL parameter
  useEffect(() => {
    if (loopId && (!currentLoop || currentLoop.id !== loopId)) {
      loadLoop(loopId);
    }
  }, [loopId, currentLoop, loadLoop]);

  const handleLoopClick = (id) => {
    if (id === loopId) return; // Already on this loop
    
    // First load the loop data
    loadLoop(id).then(result => {
      if (result) {
        // Then navigate only if the load was successful
        navigate(`/loop/${id}`, { replace: true });
      } else {
        console.error('Failed to load loop:', id);
        // Could show an error toast/notification here
      }
    });
  };

  const handleDeleteLoop = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this loop?')) {
      removeLoop(id);
      if (id === loopId) {
        navigate('/loop');
      }
    }
  };

  if (loading && loops.length === 0) {
    return <div className="loop-list-loading">Loading loops...</div>;
  }

  if (loops.length === 0) {
    return <div className="no-loops">No loops yet. Create a new loop to get started.</div>;
  }

  return (
    <div className="loop-list">
      {loops.map(loop => (
        <div 
          key={loop.id} 
          className={`loop-item ${loop.id === loopId ? 'active' : ''} ${loop.status === 'running' ? 'running' : ''}`}
          onClick={() => handleLoopClick(loop.id)}
        >
          <div className="loop-title">
            {loop.title}
            {loop.status === 'running' && <span className="loop-status-badge">Running</span>}
            {loop.status === 'paused' && <span className="loop-status-badge paused">Paused</span>}
          </div>
          <div className="loop-meta">
            <span className="participant-count">
              {loop.participants.length} participant{loop.participants.length !== 1 ? 's' : ''}
            </span>
            <button 
              className="delete-loop-button"
              onClick={(e) => handleDeleteLoop(e, loop.id)}
              aria-label="Delete loop"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoopList;