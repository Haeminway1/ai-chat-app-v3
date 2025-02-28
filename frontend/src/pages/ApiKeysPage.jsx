import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ApiKeysPage.css';

const ApiKeysPage = () => {
  const navigate = useNavigate();
  const { authenticated, keyStatus, saveKeys } = useAuth();
  const [apiKeys, setApiKeys] = useState({
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GENAI_API_KEY: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (authenticated) {
      navigate('/chat');
    }
  }, [authenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setApiKeys(prev => ({ ...prev, [name]: value }));
    
    // Clear messages
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
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
        // Redirect to chat after a short delay
        setTimeout(() => {
          navigate('/chat');
        }, 1500);
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
    <div className="api-keys-page">
      <div className="api-keys-container">
        <div className="api-keys-header">
          <h1>Setup API Keys</h1>
          <p>
            To use this app, you need to provide at least one API key for the AI providers.
            Your keys are stored locally on your computer and are not sent to any server.
          </p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            API keys saved successfully! Redirecting...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="api-keys-form">
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
    </div>
  );
};

export default ApiKeysPage;