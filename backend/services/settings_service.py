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
        
    # 새로 추가: 시스템 프롬프트 삭제 메서드
    def delete_system_prompt(self, key):
        """Delete a system prompt by key"""
        if key == 'default_system':
            return False
            
        if 'system_prompts' in self.model_manager.prompts and key in self.model_manager.prompts['system_prompts']:
            del self.model_manager.prompts['system_prompts'][key]
            self.model_manager._save_config(self.model_manager.prompt_path, self.model_manager.prompts)
            return True
        return False