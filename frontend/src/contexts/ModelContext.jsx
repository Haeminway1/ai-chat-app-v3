import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  listModels, 
  getCurrentModel, 
  changeModel,
  updateModelParameters
} from '../services/modelService';

const ModelContext = createContext(null);

export const useModel = () => useContext(ModelContext);

export const ModelProvider = ({ children }) => {
  const [providers, setProviders] = useState({});
  const [providerMapping, setProviderMapping] = useState({});
  const [modelConfigs, setModelConfigs] = useState({});
  const [currentModel, setCurrentModel] = useState(null);
  const [currentImgModel, setCurrentImgModel] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadModels = async () => {
    setLoading(true);
    try {
      const modelsData = await listModels();
      setProviders(modelsData.providers || {});
      setProviderMapping(modelsData.provider_mapping || {});
      setModelConfigs(modelsData.model_configs || {});
      
      // Also load current model
      await loadCurrentModel();
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentModel = async () => {
    try {
      const current = await getCurrentModel();
      setCurrentModel(current.current_model);
      setCurrentImgModel(current.current_img_model);
      return current;
    } catch (error) {
      console.error('Failed to load current model:', error);
      return null;
    }
  };

  const switchModel = async (modelType, isImgModel = false) => {
    try {
      await changeModel(modelType, isImgModel);
      await loadCurrentModel();
      return true;
    } catch (error) {
      console.error('Failed to change model:', error);
      return false;
    }
  };

  const updateParameters = async (modelName, parameters) => {
    try {
      await updateModelParameters(modelName, parameters);
      // Refresh model configs after update
      await loadModels();
      return true;
    } catch (error) {
      console.error('Failed to update parameters:', error);
      return false;
    }
  };

  const getProviderForModel = (modelType) => {
    const mapping = providerMapping[modelType] || {};
    return mapping.provider || null;
  };

  const getCategoryForModel = (modelType) => {
    const mapping = providerMapping[modelType] || {};
    return mapping.category || null;
  };

  const getModelConfig = (modelType) => {
    return modelConfigs[modelType] || null;
  };

  const getModelsByProvider = (provider) => {
    return Object.keys(modelConfigs)
      .filter(model => modelConfigs[model].provider === provider)
      .reduce((acc, model) => {
        const category = modelConfigs[model].category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(model);
        return acc;
      }, {});
  };

  const getAllProviders = () => {
    return [...new Set(Object.values(modelConfigs).map(config => config.provider))];
  };

  const getAllCategories = () => {
    return [...new Set(Object.values(modelConfigs).map(config => config.category))];
  };

  useEffect(() => {
    loadModels();
  }, []);

  const value = {
    providers,
    providerMapping,
    modelConfigs,
    currentModel,
    currentImgModel,
    loading,
    loadModels,
    loadCurrentModel,
    switchModel,
    updateParameters,
    getProviderForModel,
    getCategoryForModel,
    getModelConfig,
    getModelsByProvider,
    getAllProviders,
    getAllCategories
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};