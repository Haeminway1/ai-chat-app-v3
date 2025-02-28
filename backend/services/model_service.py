from ai_toolkit import ModelManager

class ModelService:
    def __init__(self):
        self.model_manager = ModelManager()
    
    def list_models(self):
        """List all available models in hierarchical structure"""
        providers = self.model_manager.list_available_models()
        provider_mapping = self.model_manager.config.get('provider_mapping', {})
        model_configs = self.model_manager.get_all_model_configs()
        
        result = {
            "providers": providers,
            "provider_mapping": provider_mapping,
            "model_configs": {}
        }
        
        # Add formatted model configs
        for model_key, model_config in model_configs.items():
            result["model_configs"][model_key] = {
                "provider": model_config.get("provider"),
                "category": model_config.get("category"),
                "model": model_config.get("model"),
                "temperature": model_config.get("temperature"),
                "max_tokens": model_config.get("max_tokens"),
                "system_prompt_key": model_config.get("system_prompt_key"),
                "supports_system_prompt": model_config.get("supports_system_prompt", True)
            }
        
        return result
    
    def get_current_model(self):
        """Get the current model"""
        current_model = self.model_manager.get_current_model()
        current_img_model = self.model_manager.get_current_img_model()
        
        current_model_config = self.model_manager.get_model_config(current_model)
        
        return {
            "current_model": current_model,
            "current_img_model": current_img_model,
            "config": current_model_config
        }
    
    def change_model(self, model_type, is_img_model=False):
        """Change the current model"""
        self.model_manager.change_model(model_type, is_img_model)
        return True
        
    def update_model_parameters(self, model_name, parameters):
        """Update parameters for a specific model"""
        if model_name not in self.model_manager.config.get('models', {}):
            raise ValueError(f"Unknown model: {model_name}")
            
        # Get current config
        model_config = self.model_manager.config['models'][model_name]
        
        # Update parameters
        for key, value in parameters.items():
            if key in ['temperature', 'max_tokens']:
                model_config[key] = value
        
        # Save config
        self.model_manager._save_config(self.model_manager.config_path, self.model_manager.config)
        
        # Reinitialize if this is the current model
        current_model = self.model_manager.get_current_model()
        if model_name == current_model:
            self.model_manager._initialize_models()
            
        return True