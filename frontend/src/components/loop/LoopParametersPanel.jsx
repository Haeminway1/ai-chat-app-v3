import React, { useState, useEffect } from 'react';
import { useModel } from '../../contexts/ModelContext';
import { useSettings } from '../../contexts/SettingsContext';
import './LoopParametersPanel.css';

const LoopParametersPanel = ({ currentModel, modelConfigs, onModelParametersChange }) => {
  const { 
    switchModel,
    updateParameters,
    getAllProviders,
    getModelsByProvider 
  } = useModel();
  
  const { jsonMode, toggleJsonMode } = useSettings();
  
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [reasoningEffort, setReasoningEffort] = useState("medium");
  const [selectedModel, setSelectedModel] = useState(currentModel || '');
  
  // Update state when model configs change or when currentModel changes
  useEffect(() => {
    if (currentModel && modelConfigs[currentModel]) {
      const config = modelConfigs[currentModel];
      setSelectedModel(currentModel);
      setTemperature(config.temperature || 0.7);
      setMaxTokens(config.max_tokens || 4000);
      setReasoningEffort(config.reasoning_effort || "medium");
    }
  }, [currentModel, modelConfigs]);
  
  // 모델 type에 따라서 O3 모델인지 확인
  const isO3Model = modelConfigs[selectedModel]?.category === 'o3';
  
  // Get all providers and models
  const providers = getAllProviders();
  
  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    switchModel(newModel);
    
    // Update parameters based on the new model's config
    if (modelConfigs[newModel]) {
      const config = modelConfigs[newModel];
      setTemperature(config.temperature || 0.7);
      setMaxTokens(config.max_tokens || 4000);
      setReasoningEffort(config.reasoning_effort || "medium");
    }
    
    // 상위 컴포넌트에 모델 변경 알림 (옵션)
    if (onModelParametersChange) {
      onModelParametersChange({
        model: newModel,
        temperature: modelConfigs[newModel]?.temperature || 0.7,
        maxTokens: modelConfigs[newModel]?.max_tokens || 4000,
        reasoningEffort: modelConfigs[newModel]?.reasoning_effort || "medium"
      });
    }
  };
  
  const getProviderName = (provider) => {
    if (provider === 'openai') return 'OpenAI';
    if (provider === 'anthropic') return 'Anthropic';
    if (provider === 'google') return 'Google';
    if (provider === 'xai') return 'xAI';
    return provider;
  };

  const getCategoryName = (category) => {
    return category.toUpperCase();
  };
  
  const handleSave = () => {
    const params = {
      max_tokens: parseInt(maxTokens)
    };
    
    if (!isO3Model) {
      params.temperature = parseFloat(temperature);
    }
    
    if (isO3Model) {
      params.reasoning_effort = reasoningEffort;
    }
    
    updateParameters(selectedModel, params);
    
    // 상위 컴포넌트에 파라미터 변경 알림 (옵션)
    if (onModelParametersChange) {
      onModelParametersChange({
        model: selectedModel,
        temperature: parseFloat(temperature),
        maxTokens: parseInt(maxTokens),
        reasoningEffort
      });
    }
  };
  
  // 파라미터가 변경되면 자동 저장
  useEffect(() => {
    const params = {
      max_tokens: parseInt(maxTokens)
    };
    
    if (!isO3Model) {
      params.temperature = parseFloat(temperature);
    }
    
    if (isO3Model) {
      params.reasoning_effort = reasoningEffort;
    }
    
    // 상위 컴포넌트에 파라미터 변경 알림 (옵션)
    if (onModelParametersChange) {
      onModelParametersChange({
        model: selectedModel,
        temperature: parseFloat(temperature),
        maxTokens: parseInt(maxTokens),
        reasoningEffort
      });
    }
  }, [temperature, maxTokens, reasoningEffort, selectedModel, isO3Model, onModelParametersChange]);
  
  // 온도 변경 처리
  const handleTemperatureChange = (e) => {
    const newTemp = e.target.value;
    setTemperature(newTemp);
  };
  
  // 토큰 변경 처리
  const handleMaxTokensChange = (e) => {
    const newTokens = e.target.value;
    setMaxTokens(newTokens);
  };
  
  // 추론 노력 변경 처리
  const handleReasoningEffortChange = (e) => {
    const newEffort = e.target.value;
    setReasoningEffort(newEffort);
  };
  
  // Render model options grouped by provider and category
  const renderModelOptions = () => {
    const options = [];
    
    providers.forEach(provider => {
      const modelsByCategory = getModelsByProvider(provider);
      
      Object.entries(modelsByCategory).forEach(([category, models]) => {
        const groupLabel = `${getProviderName(provider)} - ${getCategoryName(category)}`;
        
        options.push(
          <optgroup key={`${provider}-${category}`} label={groupLabel}>
            {models.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </optgroup>
        );
      });
    });
    
    return options;
  };
  
  return (
    <div className="loop-parameters-panel">
      <h3>Model Parameters</h3>
      
      <div className="loop-parameter model-selector">
        <label>Default Model</label>
        <select value={selectedModel || ''} onChange={handleModelChange}>
          {renderModelOptions()}
        </select>
        <div className="parameter-description">
          모델을 변경하면 새 참여자를 추가할 때 기본으로 사용됩니다.
        </div>
      </div>
      
      {!isO3Model && (
        <div className="loop-parameter">
          <label>
            Temperature: <span className="parameter-value">{temperature}</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={temperature}
            onChange={handleTemperatureChange}
          />
          <div className="parameter-description">
            온도값은 모델의 창의성을 조절합니다. 낮은 값은 더 일관된 응답을, 높은 값은 더 다양하고 창의적인 응답을 생성합니다.
          </div>
        </div>
      )}
      
      <div className="loop-parameter">
        <label>Max Tokens</label>
        <input 
          type="number" 
          min="1" 
          max="100000" 
          value={maxTokens}
          onChange={handleMaxTokensChange}
        />
        <div className="parameter-description">
          응답에서 생성할 최대 토큰 수를 설정합니다.
        </div>
      </div>
      
      {isO3Model && (
        <div className="loop-parameter">
          <label>Reasoning Effort</label>
          <select
            value={reasoningEffort}
            onChange={handleReasoningEffortChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div className="parameter-description">
            추론 노력은 O3 모델이 문제를 해결하기 위해 투입하는 노력의 정도를 조절합니다.
          </div>
        </div>
      )}
      
      <div className="json-mode-toggle">
        <label>
          <input 
            type="checkbox" 
            checked={jsonMode} 
            onChange={() => toggleJsonMode(!jsonMode)} 
          />
          JSON Mode
        </label>
        <div className="parameter-description">
          활성화하면 응답이 JSON 형식으로 제공됩니다.
        </div>
      </div>
      
      <button className="save-parameters-button" onClick={handleSave}>
        파라미터 저장
      </button>
    </div>
  );
};

export default LoopParametersPanel;