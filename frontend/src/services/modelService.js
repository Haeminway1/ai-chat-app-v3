import api from './api';

export const listModels = () => {
  return api.get('/models/list');
};

export const getCurrentModel = () => {
  return api.get('/models/current');
};

export const changeModel = (modelType, isImgModel = false) => {
  return api.post('/models/change', { model_type: modelType, is_img_model: isImgModel });
};

export const updateModelParameters = (modelName, parameters) => {
  return api.post('/models/parameters', { model_name: modelName, parameters });
};