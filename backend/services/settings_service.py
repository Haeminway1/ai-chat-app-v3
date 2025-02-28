from ai_toolkit import ModelManager

class SettingsService:
    def __init__(self):
        self.model_manager = ModelManager()
    
    def get_json_mode(self):
        """Get JSON mode status"""
        return self.model_manager.config.get('json_mode', False)
    
    def set_json_mode(self, enabled):
        """Set JSON mode"""
        self.model_manager.set_json_mode(enabled)
        return True
    
    def list_system_prompts(self):
        """List all system prompts"""
        prompt_keys = self.model_manager.list_system_prompts()
        system_prompts = self.model_manager.prompts.get('system_prompts', {})
        
        result = {}
        for key in prompt_keys:
            result[key] = system_prompts.get(key, "")
        
        return result
    
    def set_system_prompt(self, model_type, prompt_key):
        """Set system prompt for a model"""
        self.model_manager.set_system_prompt(model_type, prompt_key)
        return True
    
    def add_system_prompt(self, key, prompt):
        """Add a new system prompt"""
        self.model_manager.add_system_prompt(key, prompt)
        return True