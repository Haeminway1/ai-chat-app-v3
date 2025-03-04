import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  getJsonMode,
  setJsonMode,
  listSystemPrompts,
  setSystemPrompt,
  addSystemPrompt,
  deleteSystemPrompt as apiDeleteSystemPrompt
} from '../services/settingsService';

const SettingsContext = createContext(null);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [jsonMode, setJsonModeState] = useState(false);
  const [systemPrompts, setSystemPrompts] = useState({});
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load JSON mode
      const jsonModeData = await getJsonMode();
      setJsonModeState(jsonModeData.json_mode);
      
      // Load system prompts
      const promptsData = await listSystemPrompts();
      setSystemPrompts(promptsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleJsonMode = async (enabled) => {
    try {
      await setJsonMode(enabled);
      setJsonModeState(enabled);
      return true;
    } catch (error) {
      console.error('Failed to set JSON mode:', error);
      return false;
    }
  };

  const updateSystemPrompt = async (modelType, promptKey) => {
    try {
      await setSystemPrompt(modelType, promptKey);
      return true;
    } catch (error) {
      console.error('Failed to set system prompt:', error);
      return false;
    }
  };

  const createSystemPrompt = async (key, prompt) => {
    try {
      await addSystemPrompt(key, prompt);
      
      // Refresh prompts
      const promptsData = await listSystemPrompts();
      setSystemPrompts(promptsData);
      
      return true;
    } catch (error) {
      console.error('Failed to add system prompt:', error);
      return false;
    }
  };
  
  // 새로 추가: 시스템 프롬프트 삭제 함수
  const deleteSystemPrompt = async (key) => {
    try {
      await apiDeleteSystemPrompt(key);
      
      // Refresh prompts
      const promptsData = await listSystemPrompts();
      setSystemPrompts(promptsData);
      
      return true;
    } catch (error) {
      console.error('Failed to delete system prompt:', error);
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const value = {
    jsonMode,
    systemPrompts,
    loading,
    loadSettings,
    toggleJsonMode,
    updateSystemPrompt,
    createSystemPrompt,
    deleteSystemPrompt
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};