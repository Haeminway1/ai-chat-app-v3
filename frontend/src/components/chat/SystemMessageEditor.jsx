import React, { useState, useEffect } from 'react';
import './SystemMessageEditor.css';

const SystemMessageEditor = ({ chat, modelConfig, systemPrompts, onUpdateSystemMessage }) => {
  const [editing, setEditing] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');
  const [selectedPromptKey, setSelectedPromptKey] = useState('default_system');
  
  // 로컬 스토리지에서 상태 불러오기
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('systemMessageCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  // 접힘/펼침 상태 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('systemMessageCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);
  
  useEffect(() => {
    // Find system message
    if (!chat || !chat.messages) return;
    
    const sysMsg = chat.messages.find(msg => msg.role === 'system');
    if (sysMsg) {
      setSystemMessage(sysMsg.content);
      
      // Try to determine which prompt key matches this content
      const promptKey = Object.entries(systemPrompts || {}).find(
        ([key, content]) => content === sysMsg.content
      )?.[0] || 'default_system';
      
      setSelectedPromptKey(promptKey);
    } else {
      setSystemMessage('');
      setSelectedPromptKey('default_system');
    }
  }, [chat, systemPrompts]);
  
  // Handle Edit button click - uncollapse and enable editing
  const handleEditClick = () => {
    if (collapsed) {
      setCollapsed(false); // Expand the section if it's collapsed
    }
    setEditing(true); // Enable editing mode
  };
  
  const handleSaveSystem = () => {
    onUpdateSystemMessage(systemMessage);
    setEditing(false);
  };
  
  const handleSelectPrompt = (e) => {
    const key = e.target.value;
    setSelectedPromptKey(key);
    setSystemMessage(systemPrompts[key] || '');
  };
  
  if (!chat || !modelConfig) {
    return null;
  }
  
  const supportsSystemPrompt = modelConfig?.supports_system_prompt !== false;
  
  if (!supportsSystemPrompt) {
    return (
      <div className="system-message-container">
        <div className="system-message-header">
          <h3>System Message</h3>
        </div>
        <div className="system-message-placeholder">
          The selected model ({chat.model}) does not support system messages.
        </div>
      </div>
    );
  }
  
  return (
    <div className={`system-message-container ${collapsed ? 'collapsed' : ''}`}>
      <div className="system-message-header">
        <h3>System Message</h3>
        <div className="system-message-controls">
          <button 
            className="system-message-toggle"
            onClick={editing ? () => setEditing(false) : handleEditClick}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button 
            className="system-message-collapse"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>
      
      {!collapsed && (
        <div className="system-message-content">
          {editing ? (
            <>
              <div className="model-parameter">
                <label>Prompt Template:</label>
                <select value={selectedPromptKey} onChange={handleSelectPrompt}>
                  {Object.keys(systemPrompts || {}).map(key => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
              
              <textarea
                className="system-message-input"
                value={systemMessage}
                onChange={(e) => setSystemMessage(e.target.value)}
                placeholder="Enter a system message to set the behavior of the AI..."
              />
              
              <div className="system-message-actions">
                <button 
                  className="secondary-button"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  className="primary-button"
                  onClick={handleSaveSystem}
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <div className="system-message-display">
              {systemMessage || (
                <span className="system-message-placeholder">
                  No system message set. Click "Edit" to add one.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemMessageEditor;