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

export const addParticipant = (loopId, model, systemPrompt = '', displayName = null, userPrompt = '', temperature = 0.7, maxTokens = 4000) => {
  return api.post(`/loop/${loopId}/participant`, { 
    model, 
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    display_name: displayName,
    temperature: parseFloat(temperature) || 0.7,
    max_tokens: parseInt(maxTokens) || 4000
  });
};

export const updateParticipant = (loopId, participantId, updates) => {
  // Ensure proper field names for backend and data types
  const apiData = {
    // Explicitly include all required fields
    model: updates.model || 'gpt-4o',
    system_prompt: updates.system_prompt || '',
    user_prompt: updates.user_prompt || '',
    display_name: updates.display_name || '',
    max_tokens: parseInt(updates.max_tokens) || 4000,
    temperature: parseFloat(updates.temperature) || 0.7
  };
  
  // Make sure user_prompt is included in the request
  if (updates.user_prompt === undefined && updates.user_prompt !== '') {
    console.warn("user_prompt missing from update, setting to empty string", updates);
  }
  
  // Validate numeric values to ensure they're in reasonable ranges
  if (apiData.temperature < 0 || isNaN(apiData.temperature)) apiData.temperature = 0.7;
  if (apiData.temperature > 2) apiData.temperature = 2.0;
  
  if (apiData.max_tokens < 100 || isNaN(apiData.max_tokens)) apiData.max_tokens = 4000;
  if (apiData.max_tokens > 8000) apiData.max_tokens = 8000;
  
  // 요청 데이터를 명확하게 로깅
  console.log(`API call to update participant ${participantId} in loop ${loopId}:`, { 
    endpoint: `/loop/${loopId}/participant/${participantId}`,
    method: 'PUT',
    data: apiData
  });
  
  return api.put(`/loop/${loopId}/participant/${participantId}`, apiData);
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

export const updateLoopUserPrompt = (loopId, loopUserPrompt) => {
  return api.put(`/loop/${loopId}/loop_prompt`, { loop_user_prompt: loopUserPrompt });
};

export const addStopSequence = (loopId, model, systemPrompt = '', displayName = null, stopCondition = '') => {
  return api.post(`/loop/${loopId}/stop_sequence`, { 
    model, 
    system_prompt: systemPrompt,
    display_name: displayName,
    stop_condition: stopCondition
  });
};

export const updateStopSequence = (loopId, stopSequenceId, updates) => {
  // Ensure proper field names for backend
  const apiData = {
    ...updates,
    // Map any frontend names to backend names
    model: updates.model,
    system_prompt: updates.system_prompt,
    display_name: updates.display_name,
    stop_condition: updates.stop_condition,
    max_tokens: updates.max_tokens,
    temperature: updates.temperature
  };
  
  console.log(`API call to update stop sequence ${stopSequenceId} in loop ${loopId}:`, apiData);
  return api.put(`/loop/${loopId}/stop_sequence/${stopSequenceId}`, apiData);
};

export const removeStopSequence = (loopId, stopSequenceId) => {
  return api.delete(`/loop/${loopId}/stop_sequence/${stopSequenceId}`);
};

export const reorderStopSequences = (loopId, stopSequenceIds) => {
  return api.post(`/loop/${loopId}/reorder_stop_sequences`, { stop_sequence_ids: stopSequenceIds });
};