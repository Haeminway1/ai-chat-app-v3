import React, { useState } from 'react';
import ParticipantsList from './ParticipantsList';
import StopSequencesList from './StopSequencesList';
import LoopMessages from './LoopMessages';
import LoopControls from './LoopControls';
import './LoopContent.css';

const LoopContent = () => {
  const [activeTab, setActiveTab] = useState('setup');

  return (
    <div className="loop-content-container">
      <ul className="loop-tabs">
        <li 
          className={`loop-tab ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('setup')}
        >
          Setup
        </li>
        <li 
          className={`loop-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </li>
      </ul>
      
      <div className="loop-tab-content">
        {activeTab === 'setup' ? (
          <div className="setup-container">
            <ParticipantsList />
            <StopSequencesList />
          </div>
        ) : (
          <div className="messages-container">
            <LoopMessages />
            <LoopControls />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoopContent; 