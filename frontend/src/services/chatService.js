import api from './api';

export const createChat = (title, provider, model, parameters) => {
  return api.post('/chat/new', { title, provider, model, parameters });
};

export const listChats = () => {
  return api.get('/chat/list');
};

export const getChat = (chatId) => {
  return api.get(`/chat/${chatId}`);
};

export const deleteChat = (chatId) => {
  return api.delete(`/chat/${chatId}`);
};

export const sendMessage = (chatId, content) => {
  return api.post(`/chat/${chatId}/message`, { content });
};

export const updateSystemMessage = (chatId, content) => {
  return api.post(`/chat/${chatId}/system`, { content });
};