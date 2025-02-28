import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useModel } from '../contexts/ModelContext';
import { useSettings } from '../contexts/SettingsContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentModel, 
    modelConfigs, 
    providerMapping, 
    switchModel,
    getAllProviders,
    getModelsByProvider 
  } = useModel();
  const { jsonMode, toggleJsonMode } = useSettings();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/chat')) return 'Chat';
    if (path === '/settings') return 'Settings';
    if (path === '/api-keys') return 'API Keys';
    return 'AI Chat App';
  };

  const handleModelChange = (e) => {
    switchModel(e.target.value);
  };

  const getProviderName = (provider) => {
    if (provider === 'openai') return 'OpenAI';
    if (provider === 'anthropic') return 'Anthropic';
    if (provider === 'google') return 'Google';
    return provider;
  };

  const getCategoryName = (category) => {
    return category.toUpperCase();
  };

  const handleJsonModeToggle = () => {
    toggleJsonMode(!jsonMode);
  };

  // Get all providers
  const providers = getAllProviders();

  return (
    <header className="app-header">
      <div className="header-title">
        <h1>{getPageTitle()}</h1>
      </div>
      
      {location.pathname.startsWith('/chat') && (
        <div className="header-controls">
          <div className="model-selector">
            <label>Model:</label>
            <select value={currentModel || ''} onChange={handleModelChange}>
              {providers.map(provider => {
                const modelsByCategory = getModelsByProvider(provider);
                return Object.entries(modelsByCategory).map(([category, models]) => (
                  <optgroup key={`${provider}-${category}`} 
                    label={`${getProviderName(provider)} - ${getCategoryName(category)}`}>
                    {models.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </optgroup>
                ));
              })}
            </select>
          </div>
          
          <div className="json-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={jsonMode} 
                onChange={handleJsonModeToggle} 
              />
              JSON Mode
            </label>
          </div>
          
          <button 
            className="settings-button"
            onClick={() => navigate('/settings')}
          >
            <span className="icon">⚙️</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;