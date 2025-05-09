import api from './api';

export const checkAuth = async () => {
  try {
    return await api.get('/auth/check');
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false };
  }
};

export const getApiKeys = async () => {
  try {
    return await api.get('/auth/keys');
  } catch (error) {
    console.error('Failed to get API keys status:', error);
    return { OPENAI_API_KEY: false, ANTHROPIC_API_KEY: false, GENAI_API_KEY: false, XAI_API_KEY: false };
  }
};

export const saveApiKeys = async (keys) => {
  try {
    const response = await api.post('/auth/keys', keys);
    return response.status === "success";
  } catch (error) {
    console.error('Failed to save API keys:', error);
    throw new Error('Failed to save API keys: ' + (error.message || 'Unknown error'));
  }
};