import api from './api';

export const createLoop = (title) => {
  return api.post('/loop/new', { title });
};

export const listLoops = () => {
  return api.get('/loop/list');
};

export const getLoop = (loopId) => {
  return api.get(`/loop/${loopId}`);
};

export const updateLoopTitle = (loopId, title) => {
  return api.post(`/loop/${loopId}/title`, { title });
};

export const deleteLoop = (loopId) => {
  return api.delete(`/loop/${loopId}`);
};

export const addParticipant = (loopId, model, systemPrompt = '', displayName = null) => {
  return api.post(`/loop/${loopId}/participant`, { 
    model, 
    system_prompt: systemPrompt,
    display_name: displayName
  });
};

export const updateParticipant = (loopId, participantId, updates) => {
  return api.put(`/loop/${loopId}/participant/${participantId}`, updates);
};

export const removeParticipant = (loopId, participantId) => {
  return api.delete(`/loop/${loopId}/participant/${participantId}`);
};

export const reorderParticipants = (loopId, participantIds) => {
  return api.post(`/loop/${loopId}/reorder`, { participant_ids: participantIds });
};

export const startLoop = (loopId, initialPrompt) => {
  return api.post(`/loop/${loopId}/start`, { initial_prompt: initialPrompt });
};

export const pauseLoop = (loopId) => {
  return api.post(`/loop/${loopId}/pause`);
};

export const resumeLoop = (loopId) => {
  return api.post(`/loop/${loopId}/resume`);
};

export const stopLoop = (loopId) => {
  return api.post(`/loop/${loopId}/stop`);
};

export const resetLoop = (loopId) => {
  return api.post(`/loop/${loopId}/reset`);
};