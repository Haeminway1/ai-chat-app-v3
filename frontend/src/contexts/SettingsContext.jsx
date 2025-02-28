import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  getJsonMode,
  setJsonMode,
  listSystemPrompts,
  setSystemPrompt,
  addSystemPrompt
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
    createSystemPrompt
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};