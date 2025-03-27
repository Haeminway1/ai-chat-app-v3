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

export const updateLoopUserPrompt = async (loopId, loopUserPrompt) => {
  try {
    const response = await fetch(`/api/loop/${loopId}/loop_prompt`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ loop_user_prompt: loopUserPrompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update loop user prompt');
    }

    const data = await response.json();
    return data.loop;
  } catch (error) {
    console.error('Error updating loop user prompt:', error);
    throw error;
  }
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
  return api.put(`/loop/${loopId}/stop_sequence/${stopSequenceId}`, updates);
};

export const removeStopSequence = (loopId, stopSequenceId) => {
  return api.delete(`/loop/${loopId}/stop_sequence/${stopSequenceId}`);
};

export const reorderStopSequences = (loopId, stopSequenceIds) => {
  return api.post(`/loop/${loopId}/reorder_stop_sequences`, { stop_sequence_ids: stopSequenceIds });
};