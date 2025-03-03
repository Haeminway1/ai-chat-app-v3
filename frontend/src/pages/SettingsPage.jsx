import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import './SettingsPage.css';

const SettingsPage = ({ returnPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { modelConfigs } = useModel();
  const { 
    systemPrompts,
    updateSystemPrompt,
    createSystemPrompt
  } = useSettings();
  const { keyStatus, saveKeys } = useAuth();
  
  const [newPromptKey, setNewPromptKey] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState({});
  const [activeTab, setActiveTab] = useState('prompts');
  const [apiKeys, setApiKeys] = useState({
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GENAI_API_KEY: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
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

  const handleClose = () => {
    // Use the return path from props or state, or default to /chat
    const from = returnPath || location.state?.from || '/chat';
    navigate(from, { replace: true });
  };
  
  const handleApiKeyChange = (e) => {
    const { name, value } = e.target;
    setApiKeys(prev => ({ ...prev, [name]: value }));
    
    // Clear messages
    setError('');
    setSuccess(false);
  };

  const handleApiKeySave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    
    try {
      // Make sure at least one API key is provided
      if (!apiKeys.OPENAI_API_KEY && !apiKeys.ANTHROPIC_API_KEY && !apiKeys.GENAI_API_KEY) {
        throw new Error('Please provide at least one API key');
      }
      
      const result = await saveKeys(apiKeys);
      
      if (result) {
        setSuccess(true);
      } else {
        throw new Error('Failed to save API keys');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="settings-page">
      <div className="settings-close">
        <button onClick={handleClose} className="close-button">×</button>
      </div>
      
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          Prompt Settings
        </button>
        <button 
          className={`tab-button ${activeTab === 'api-keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-keys')}
        >
          API Keys
        </button>
      </div>
      
      {activeTab === 'prompts' && (
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
      )}
      
      {activeTab === 'api-keys' && (
        <section className="settings-section">
          <h2>API Keys</h2>
          
          <div className="api-keys-container">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                API keys saved successfully!
              </div>
            )}
            
            <form onSubmit={handleApiKeySave} className="api-keys-form">
              <div className="api-key-group">
                <label>
                  <div className="key-label">
                    <span>OpenAI API Key</span>
                    {keyStatus.openai && <span className="key-status active">Active</span>}
                  </div>
                  <input
                    type="password"
                    name="OPENAI_API_KEY"
                    value={apiKeys.OPENAI_API_KEY}
                    onChange={handleApiKeyChange}
                    placeholder="sk-..."
                  />
                </label>
                <div className="key-help">
                  Required for GPT models. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">Get API key</a>
                </div>
              </div>
              
              <div className="api-key-group">
                <label>
                  <div className="key-label">
                    <span>Anthropic API Key</span>
                    {keyStatus.anthropic && <span className="key-status active">Active</span>}
                  </div>
                  <input
                    type="password"
                    name="ANTHROPIC_API_KEY"
                    value={apiKeys.ANTHROPIC_API_KEY}
                    onChange={handleApiKeyChange}
                    placeholder="sk-ant-..."
                  />
                </label>
                <div className="key-help">
                  Required for Claude models. <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">Get API key</a>
                </div>
              </div>
              
              <div className="api-key-group">
                <label>
                  <div className="key-label">
                    <span>Google AI API Key</span>
                    {keyStatus.google && <span className="key-status active">Active</span>}
                  </div>
                  <input
                    type="password"
                    name="GENAI_API_KEY"
                    value={apiKeys.GENAI_API_KEY}
                    onChange={handleApiKeyChange}
                    placeholder="AI..."
                  />
                </label>
                <div className="key-help">
                  Required for Gemini models. <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get API key</a>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="primary-button"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save API Keys'}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};

export default SettingsPage;