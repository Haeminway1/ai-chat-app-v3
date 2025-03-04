import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ApiKeysPage.css';

const ApiKeysPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { keyStatus, saveKeys } = useAuth();
  const [apiKeys, setApiKeys] = useState({
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GENAI_API_KEY: '',
    XAI_API_KEY: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 저장된 키 상태에 따라 placeholder를 설정하기 위한 효과
  useEffect(() => {
    // 플레이스홀더 텍스트 업데이트
    const placeholders = {
      OPENAI_API_KEY: keyStatus.openai ? '(저장된 키 있음)' : 'sk-...',
      ANTHROPIC_API_KEY: keyStatus.anthropic ? '(저장된 키 있음)' : 'sk-ant-...',
      GENAI_API_KEY: keyStatus.google ? '(저장된 키 있음)' : 'AI...',
      XAI_API_KEY: keyStatus.xai ? '(저장된 키 있음)' : 'Enter your xAI API key'
    };
    
    // 플레이스홀더 적용할 요소들 선택
    document.querySelectorAll('.api-key-group input').forEach(input => {
      const name = input.getAttribute('name');
      if (placeholders[name]) {
        input.setAttribute('placeholder', placeholders[name]);
      }
    });
  }, [keyStatus]);

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
      // 빈 API 키 필드는 제출에서 필터링
      const keysToSubmit = {};
      let hasAnyKey = false;
      
      // 빈 값이 아닌 키만 제출
      Object.entries(apiKeys).forEach(([key, value]) => {
        if (value) {
          keysToSubmit[key] = value;
          hasAnyKey = true;
        }
      });
      
      // 폼에 키가 하나도 없으면 기존 키 상태 확인
      if (!hasAnyKey && !Object.values(keyStatus).some(status => status)) {
        throw new Error('Please provide at least one API key');
      }
      
      // 키가 있거나 기존 키가 유지되면 저장 진행
      const result = await saveKeys(keysToSubmit);
      
      if (result) {
        setSuccess(true);
        // Redirect to chat after a short delay
        setTimeout(() => {
          // Redirect to the original intended destination or chat
          const from = location.state?.from || '/chat';
          navigate(from, { replace: true });
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
            <br />
            <small className="text-secondary">(Leave fields empty to keep existing keys)</small>
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
                placeholder={keyStatus.openai ? "(저장된 키 있음)" : "sk-..."}
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
                placeholder={keyStatus.anthropic ? "(저장된 키 있음)" : "sk-ant-..."}
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
                placeholder={keyStatus.google ? "(저장된 키 있음)" : "AI..."}
              />
            </label>
            <div className="key-help">
              Required for Gemini models. <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get API key</a>
            </div>
          </div>
          
          <div className="api-key-group">
            <label>
              <div className="key-label">
                <span>xAI API Key</span>
                {keyStatus.xai && <span className="key-status active">Active</span>}
              </div>
              <input
                type="password"
                name="XAI_API_KEY"
                value={apiKeys.XAI_API_KEY}
                onChange={handleChange}
                placeholder={keyStatus.xai ? "(저장된 키 있음)" : "Enter your xAI API key"}
              />
            </label>
            <div className="key-help">
              Required for Grok models. Get your API key from the xAI website.
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