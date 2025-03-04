import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './SettingsPage.css';

const SettingsPage = ({ returnPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { modelConfigs } = useModel();
  const { 
    systemPrompts,
    updateSystemPrompt,
    createSystemPrompt,
    deleteSystemPrompt, // 새로 필요한 함수
    loadSettings
  } = useSettings();
  const { keyStatus, saveKeys } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // 프롬프트 상태 관리
  const [newPromptKey, setNewPromptKey] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editedPromptText, setEditedPromptText] = useState('');
  
  // 모델별 선택된 프롬프트
  const [selectedPrompts, setSelectedPrompts] = useState({});
  const [activeTab, setActiveTab] = useState('prompts');
  const [apiKeys, setApiKeys] = useState({
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GENAI_API_KEY: '',
    XAI_API_KEY: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // 초기화: 선택된 프롬프트와 모델 설정
  useEffect(() => {
    const initialPrompts = {};
    Object.keys(modelConfigs).forEach(modelKey => {
      const config = modelConfigs[modelKey];
      initialPrompts[modelKey] = config.system_prompt_key || 'default_system';
    });
    setSelectedPrompts(initialPrompts);
  }, [modelConfigs]);
  
  // 모델에 프롬프트 적용 함수
  const handlePromptChange = async (modelType, promptKey) => {
    setSelectedPrompts({
      ...selectedPrompts,
      [modelType]: promptKey
    });
    
    await updateSystemPrompt(modelType, promptKey);
  };
  
  // 프롬프트 추가 함수
  const handleAddPrompt = async (e) => {
    e.preventDefault();
    if (!newPromptKey || !newPromptText) return;
    
    await createSystemPrompt(newPromptKey, newPromptText);
    
    // 폼 초기화
    setNewPromptKey('');
    setNewPromptText('');
    
    // 설정 다시 로드
    await loadSettings();
  };
  
  // 프롬프트 편집 시작
  const handleStartEdit = (key, text) => {
    setEditingPrompt(key);
    setEditedPromptText(text);
  };
  
  // 프롬프트 편집 저장
  const handleSaveEdit = async () => {
    if (editingPrompt && editedPromptText) {
      await createSystemPrompt(editingPrompt, editedPromptText);
      setEditingPrompt(null);
      
      // 설정 다시 로드
      await loadSettings();
    }
  };
  
  // 프롬프트 삭제
  const handleDeletePrompt = async (key) => {
    // 삭제 확인
    if (window.confirm(`Are you sure you want to delete the prompt "${key}"?`)) {
      if (key === 'default_system') {
        alert('The default system prompt cannot be deleted.');
        return;
      }
      
      await deleteSystemPrompt(key);
      
      // 설정 다시 로드
      await loadSettings();
    }
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
      
      const result = await saveKeys(keysToSubmit);
      
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
        <button 
          className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
      </div>
      
      {activeTab === 'prompts' && (
        <section className="settings-section">
          <h2>System Prompts</h2>
          
          {/* 시스템 프롬프트 목록 */}
          <div className="prompts-list">
            <h3>Prompt Library</h3>
            <p className="settings-description">
              Manage your system prompts here. You can create, edit, and delete prompts, 
              and assign them to different models.
            </p>
            
            <div className="prompt-cards">
              {Object.entries(systemPrompts).map(([key, text]) => (
                <div key={key} className="prompt-card">
                  <div className="prompt-card-header">
                    <h4>{key}</h4>
                    <div className="prompt-card-actions">
                      {editingPrompt !== key ? (
                        <>
                          <button 
                            className="edit-button"
                            onClick={() => handleStartEdit(key, text)}
                          >
                            Edit
                          </button>
                          {key !== 'default_system' && (
                            <button 
                              className="delete-button"
                              onClick={() => handleDeletePrompt(key)}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      ) : (
                        <button 
                          className="save-button"
                          onClick={handleSaveEdit}
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {editingPrompt === key ? (
                    <textarea
                      className="prompt-edit-textarea"
                      value={editedPromptText}
                      onChange={(e) => setEditedPromptText(e.target.value)}
                      rows={5}
                    />
                  ) : (
                    <div className="prompt-card-content">
                      {text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 새 프롬프트 추가 폼 */}
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
          
          {/* 모델별 프롬프트 할당 */}
          <div className="model-prompts-assignment">
            <h3>Assign Prompts to Models</h3>
            <div className="model-prompts">
              {Object.keys(modelConfigs).map(modelKey => (
                <div key={modelKey} className="model-prompt-setting">
                  <h4>{modelKey}</h4>
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
                </div>
              ))}
            </div>
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
                    onChange={handleApiKeyChange}
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
                    onChange={handleApiKeyChange}
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
                    onChange={handleApiKeyChange}
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
        </section>
      )}
      
      {activeTab === 'appearance' && (
        <section className="settings-section">
          <h2>Appearance Settings</h2>
          
          <div className="appearance-settings">
            <h3>Theme</h3>
            <p className="settings-description">Choose between light and dark mode for the application.</p>
            <div className="theme-selector">
              <button 
                className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <span className="theme-icon">☀️</span>
                Light
              </button>
              <button 
                className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <span className="theme-icon">🌙</span>
                Dark
              </button>
            </div>
            
            <div className="theme-preview">
              <div className="theme-preview-light">
                <div className="preview-label">Light Mode</div>
                <div className="preview-box light-preview"></div>
              </div>
              <div className="theme-preview-dark">
                <div className="preview-label">Dark Mode</div>
                <div className="preview-box dark-preview"></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SettingsPage;