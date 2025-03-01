import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { modelConfigs, currentModel, switchModel } = useModel();
  const { 
    systemPrompts, 
    jsonMode, 
    toggleJsonMode, 
    updateSystemPrompt,
    createSystemPrompt
  } = useSettings();
  
  const [newPromptKey, setNewPromptKey] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState({});
  
  // Initialize selected prompts with current values
  React.useEffect(() => {
    const initialPrompts = {};
    Object.keys(modelConfigs).forEach(modelKey => {
      const config = modelConfigs[modelKey];
      initialPrompts[modelKey] = config.system_prompt_key || 'default_system';
    });
    setSelectedPrompts(initialPrompts);
  }, [modelConfigs]);
  
  const handlePromptChange = async (modelType, promptKey) => {
    setSelectedPrompts({
      ...selectedPrompts,
      [modelType]: promptKey
    });
    
    await updateSystemPrompt(modelType, promptKey);
  };
  
  const handleAddPrompt = async (e) => {
    e.preventDefault();
    if (!newPromptKey || !newPromptText) return;
    
    await createSystemPrompt(newPromptKey, newPromptText);
    
    // Reset form
    setNewPromptKey('');
    setNewPromptText('');
  };

  const handleBackToChat = () => {
    navigate('/chat');
  };
  
  return (
    <div className="settings-page">
      <div className="settings-header">
        <button onClick={handleBackToChat} className="back-button primary-button">
          Back to Chat
        </button>
      </div>
      
      <section className="settings-section">
        <h2>Global Settings</h2>
        
        <div className="setting-item">
          <label className="toggle-label">
            JSON Mode
            <input 
              type="checkbox" 
              checked={jsonMode} 
              onChange={() => toggleJsonMode(!jsonMode)} 
            />
            <span className="toggle-slider"></span>
          </label>
          <p className="setting-description">
            Enable JSON mode to receive structured responses from all models.
          </p>
        </div>
      </section>
      
      <section className="settings-section">
        <h2>System Prompts</h2>
        
        <div className="model-prompts">
          {Object.keys(modelConfigs).map(modelKey => (
            <div key={modelKey} className="model-prompt-setting">
              <h3>{modelKey} Model</h3>
              <select 
                value={selectedPrompts[modelKey] || ''} 
                onChange={(e) => handlePromptChange(modelKey, e.target.value)}
              >
                {Object.keys(systemPrompts).map(promptKey => (
                  <option key={promptKey} value={promptKey}>
                    {promptKey}
                  </option>
                ))}
              </select>
              <div className="prompt-preview">
                <p>{systemPrompts[selectedPrompts[modelKey]] || ''}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="add-prompt-form">
          <h3>Add New System Prompt</h3>
          <form onSubmit={handleAddPrompt}>
            <div className="form-group">
              <label>Prompt Key:</label>
              <input 
                type="text"
                value={newPromptKey}
                onChange={(e) => setNewPromptKey(e.target.value)}
                placeholder="e.g., creative_assistant"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Prompt Text:</label>
              <textarea 
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                placeholder="Enter the system prompt text..."
                rows={5}
                required
              />
            </div>
            
            <button type="submit" className="primary-button">
              Add Prompt
            </button>
          </form>
        </div>
      </section>
      
      <div className="settings-footer">
        <button onClick={handleBackToChat} className="primary-button">
          Return to Chat
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;