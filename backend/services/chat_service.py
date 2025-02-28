from models.chat import Chat, ChatStore
import uuid
from datetime import datetime
from ai_toolkit import ModelManager

class ChatService:
    def __init__(self):
        self.chat_store = ChatStore()
        self.model_manager = ModelManager()
    
    def create_chat(self, title=None, provider=None, model=None, parameters=None):
        """Create a new chat"""
        chat = Chat(title)
        
        # Set model settings if provided
        if provider or model:
            # Change model in manager if needed
            if model and model != self.model_manager.get_current_model():
                self.model_manager.change_model(model)
            
            chat.provider = provider or self.model_manager.config.get('provider_mapping', {}).get(model, {}).get('provider')
            chat.model = model or self.model_manager.get_current_model()
            chat.parameters = parameters or self.model_manager.get_parameters(chat.provider, chat.model)
        else:
            # Use current model settings
            current_model = self.model_manager.get_current_model()
            provider_info = self.model_manager.config.get('provider_mapping', {}).get(current_model, {})
            
            chat.provider = provider_info.get('provider')
            chat.model = current_model
            chat.parameters = self.model_manager.get_parameters(chat.provider, chat.model)
        
        # Add system message based on model's system prompt if model supports it
        model_config = self.model_manager.get_model_config(chat.model)
        supports_system = model_config.get('supports_system_prompt', True)
        
        if supports_system:
            system_prompt_key = model_config.get('system_prompt_key')
            if system_prompt_key:
                system_prompt = self.model_manager.prompts.get('system_prompts', {}).get(system_prompt_key, '')
                if system_prompt:
                    chat.add_message('system', system_prompt)
        
        # Save the chat
        self.chat_store.save_chat(chat)
        
        return chat
    
    def list_chats(self):
        """List all chats"""
        return self.chat_store.list_chats()
    
    def get_chat(self, chat_id):
        """Get a specific chat"""
        return self.chat_store.get_chat(chat_id)
    
    def delete_chat(self, chat_id):
        """Delete a chat"""
        return self.chat_store.delete_chat(chat_id)
    
    def update_system_message(self, chat_id, content):
        """Update system message for a chat"""
        chat = self.chat_store.get_chat(chat_id)
        
        if not chat:
            return {"error": "Chat not found"}
        
        # Check if model supports system messages
        model_config = self.model_manager.get_model_config(chat.model)
        supports_system = model_config.get('supports_system_prompt', True)
        
        if not supports_system:
            return {
                "error": f"Model {chat.model} does not support system messages",
                "chat": chat.to_dict()
            }
            
        # Find existing system message
        system_message = next((msg for msg in chat.messages if msg.role == 'system'), None)
        
        if system_message:
            # Update existing system message
            system_message.content = content
            system_message.timestamp = datetime.now()
        else:
            # Add new system message at the beginning
            system_message = chat.add_message('system', content)
            # Move system message to beginning of messages list
            chat.messages.remove(system_message)
            chat.messages.insert(0, system_message)
        
        # Update chat timestamp
        chat.updated_at = datetime.now()
        
        # Save the updated chat
        self.chat_store.save_chat(chat)
        
        return {
            "status": "success",
            "chat": chat.to_dict()
        }
    
    def add_message_and_get_response(self, chat_id, content):
        """Add a user message to a chat and get AI response"""
        chat = self.chat_store.get_chat(chat_id)
        
        if not chat:
            return {"error": "Chat not found"}
        
        # Add user message
        user_message = chat.add_message('user', content)
        
        # Make sure we're using the right model
        current_model = self.model_manager.get_current_model()
        if chat.model != current_model:
            self.model_manager.change_model(chat.model)
        
        # Get model provider
        model_config = self.model_manager.get_model_config(chat.model)
        provider = model_config.get('provider', None)
        
        # Get messages in format expected by model manager
        messages = []
        for msg in chat.messages:
            if provider == 'openai' and msg.role == 'user':
                # For OpenAI, user messages need content as an array with type field
                messages.append({
                    "role": msg.role,
                    "content": [{"type": "text", "text": msg.content}]
                })
            else:
                # For other providers or non-user messages, use string content
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Get AI response
        try:
            response_content = self.model_manager.generate_content(messages)
            ai_message = chat.add_message('assistant', response_content)
            
            # Save the updated chat
            self.chat_store.save_chat(chat)
            
            return {
                "status": "success",
                "chat": chat.to_dict()
            }
        except Exception as e:
            # Add error message to chat
            error_message = f"Error: {str(e)}"
            chat.add_message('system', error_message)
            self.chat_store.save_chat(chat)
            
            return {
                "error": error_message,
                "chat": chat.to_dict()
            }