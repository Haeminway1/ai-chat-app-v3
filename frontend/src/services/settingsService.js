import api from './api';

export const getJsonMode = () => {
  return api.get('/settings/json_mode');
};

export const setJsonMode = (enabled) => {
  return api.post('/settings/json_mode', { enabled });
};

export const listSystemPrompts = () => {
  return api.get('/settings/system_prompts');
};

export const setSystemPrompt = (modelType, promptKey) => {
  return api.post(`/settings/system_prompts/${modelType}`, { prompt_key: promptKey });
};

export const addSystemPrompt = (key, prompt) => {
  return api.post('/settings/system_prompts', { key, prompt });
};