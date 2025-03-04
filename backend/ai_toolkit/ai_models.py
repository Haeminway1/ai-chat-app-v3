# ai_toolkit/ai_models.py
import os
import logging
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Union, List, Optional, Callable, Type

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AIModel(ABC):
    """Base abstract class for all AI models"""
    
    def __init__(self, model_config: Dict[str, Any]):
        """
        Initialize the AI model with configuration.
        
        Args:
            model_config (Dict[str, Any]): Model configuration
        """
        self.model_config = model_config
        
    @abstractmethod
    def generate_content(self, prompt: Union[str, Dict, List]) -> str:
        """
        Generate content using the model.
        
        Args:
            prompt (Union[str, Dict, List]): Prompt for content generation
            
        Returns:
            str: Generated content
        """
        pass
    
    def _get_env_var(self, var_name: str) -> str:
        """
        Get environment variable with validation.
        
        Args:
            var_name (str): Name of the environment variable
            
        Returns:
            str: Value of the environment variable
            
        Raises:
            ValueError: If environment variable is not set
        """
        value = os.getenv(var_name)
        if not value:
            raise ValueError(f"{var_name} environment variable is not set")
        return value
    
    def _format_json_response(self, response: str, template: Optional[Dict] = None) -> str:
        """
        Format response according to JSON template if provided.
        
        Args:
            response (str): Raw response from the model
            template (Optional[Dict], optional): JSON template to use. Defaults to None.
            
        Returns:
            str: Formatted response
        """
        if not template:
            return response
            
        try:
            # Try to parse response as JSON
            parsed = json.loads(response)
            
            # If template contains 'response' field, fill it with parsed content
            if isinstance(template, dict) and 'response' in template:
                template['response'] = parsed
                return json.dumps(template, ensure_ascii=False)
        except:
            # If response is not valid JSON or other error occurs
            if isinstance(template, dict) and 'response' in template:
                template['response'] = response
                return json.dumps(template, ensure_ascii=False)
        
        # Fallback to original response
        return response


class GPTModel(AIModel):
    """OpenAI GPT model implementation"""
    
    def __init__(self, model_config: Dict[str, Any]):
        """
        Initialize the GPT model.
        
        Args:
            model_config (Dict[str, Any]): Model configuration
        """
        super().__init__(model_config)
        
        # Import OpenAI library
        from openai import OpenAI
        
        # Get API key from environment
        api_key = self._get_env_var('OPENAI_API_KEY')
        
        # Initialize OpenAI client - FIXED for latest version
        self.client = OpenAI(api_key=api_key)
        
        logger.info(f"Initialized GPT model: {model_config.get('model', 'unknown')}")

    def generate_content(self, prompt: Union[str, Dict]) -> str:
        """
        Generate content using the GPT model.
        
        Args:
            prompt (Union[str, Dict]): Prompt for content generation
            
        Returns:
            str: Generated content
        """
        try:
            # Handle JSON template if provided
            json_template = None
            if isinstance(prompt, dict) and 'json_template' in prompt:
                json_template = prompt.pop('json_template', None)
            
            # Format messages for OpenAI API
            if isinstance(prompt, list):
                # If prompt is a list of messages, ensure proper formatting
                messages = self._format_messages_for_openai(prompt)
                
                response = self.client.chat.completions.create(
                    model=self.model_config['model'],
                    messages=messages,
                    max_tokens=self.model_config['max_tokens'],
                    temperature=self.model_config['temperature']
                )
                
            # Handle different prompt formats
            elif isinstance(prompt, dict) and "messages" in prompt:
                # Use provided messages structure
                messages = self._format_messages_for_openai(prompt["messages"])
                
                params = {
                    "model": prompt.get("model", self.model_config['model']),
                    "messages": messages,
                    "max_tokens": self.model_config['max_tokens'],
                    "temperature": self.model_config['temperature']
                }
                
                # Add response format if specified
                if "response_format" in prompt:
                    params["response_format"] = prompt["response_format"]
                
                response = self.client.chat.completions.create(**params)
            else:
                # Create messages from string prompt
                system_message = self.model_config.get('system_message', '')
                messages = []
                
                if system_message:
                    messages.append({"role": "system", "content": system_message})
                
                messages.append({
                    "role": "user", 
                    "content": [{"type": "text", "text": prompt}]
                })
                
                response = self.client.chat.completions.create(
                    model=self.model_config['model'],
                    messages=messages,
                    max_tokens=self.model_config['max_tokens'],
                    temperature=self.model_config['temperature']
                )
            
            content = response.choices[0].message.content
            
            # Apply JSON template if provided
            if json_template:
                return self._format_json_response(content, json_template)
                
            return content
            
        except Exception as e:
            logger.error(f"GPT model error: {str(e)}")
            raise

    def _format_messages_for_openai(self, messages: List[Dict]) -> List[Dict]:
        """Format messages for OpenAI API compliance"""
        formatted_messages = []
        
        for msg in messages:
            if msg["role"] == "user" and isinstance(msg["content"], str):
                # Format user messages to have array content with type
                formatted_messages.append({
                    "role": msg["role"],
                    "content": [{"type": "text", "text": msg["content"]}]
                })
            else:
                # Leave other messages as they are
                formatted_messages.append(msg)
        
        return formatted_messages


class XAIModel(AIModel):
    """XAI Grok model implementation using OpenAI compatible API"""
    
    def __init__(self, model_config: Dict[str, Any]):
        """
        Initialize the XAI model.
        
        Args:
            model_config (Dict[str, Any]): Model configuration
        """
        super().__init__(model_config)
        
        # Import OpenAI library
        from openai import OpenAI
        
        # Get API key from environment
        api_key = self._get_env_var('XAI_API_KEY')
        
        # Initialize OpenAI client with xAI's base URL
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.x.ai/v1"
        )
        
        logger.info(f"Initialized XAI model: {model_config.get('model', 'unknown')}")

    def generate_content(self, prompt: Union[str, Dict, List]) -> str:
        """
        Generate content using the XAI model.
        
        Args:
            prompt (Union[str, Dict, List]): Prompt for content generation
            
        Returns:
            str: Generated content
        """
        try:
            # Handle JSON template if provided
            json_template = None
            if isinstance(prompt, dict) and 'json_template' in prompt:
                json_template = prompt.pop('json_template', None)
            
            # Format messages for OpenAI API
            if isinstance(prompt, list):
                # If prompt is a list of messages, ensure proper formatting
                messages = self._format_messages_for_openai(prompt)
                
                response = self.client.chat.completions.create(
                    model=self.model_config['model'],
                    messages=messages,
                    max_tokens=self.model_config['max_tokens'],
                    temperature=self.model_config['temperature']
                )
                
            # Handle different prompt formats
            elif isinstance(prompt, dict) and "messages" in prompt:
                # Use provided messages structure
                messages = self._format_messages_for_openai(prompt["messages"])
                
                params = {
                    "model": prompt.get("model", self.model_config['model']),
                    "messages": messages,
                    "max_tokens": self.model_config['max_tokens'],
                    "temperature": self.model_config['temperature']
                }
                
                # Add response format if specified
                if "response_format" in prompt:
                    params["response_format"] = prompt["response_format"]
                
                response = self.client.chat.completions.create(**params)
            else:
                # Create messages from string prompt
                system_message = self.model_config.get('system_message', '')
                messages = []
                
                if system_message:
                    messages.append({"role": "system", "content": system_message})
                
                messages.append({
                    "role": "user", 
                    "content": [{"type": "text", "text": prompt}]
                })
                
                response = self.client.chat.completions.create(
                    model=self.model_config['model'],
                    messages=messages,
                    max_tokens=self.model_config['max_tokens'],
                    temperature=self.model_config['temperature']
                )
            
            content = response.choices[0].message.content
            
            # Apply JSON template if provided
            if json_template:
                return self._format_json_response(content, json_template)
                
            return content
            
        except Exception as e:
            logger.error(f"XAI model error: {str(e)}")
            raise

    def _format_messages_for_openai(self, messages: List[Dict]) -> List[Dict]:
        """Format messages for OpenAI API compliance"""
        formatted_messages = []
        
        for msg in messages:
            if msg["role"] == "user" and isinstance(msg["content"], str):
                # Format user messages to have array content with type
                formatted_messages.append({
                    "role": msg["role"],
                    "content": [{"type": "text", "text": msg["content"]}]
                })
            else:
                # Leave other messages as they are
                formatted_messages.append(msg)
        
        return formatted_messages


class O3MiniModel(AIModel):
    """OpenAI O3Mini model implementation"""
    
    def __init__(self, model_config: Dict[str, Any]):
        """
        Initialize the O3Mini model.
        
        Args:
            model_config (Dict[str, Any]): Model configuration
        """
        super().__init__(model_config)
        
        # Import OpenAI library
        from openai import OpenAI
        
        # Get API key from environment
        api_key = self._get_env_var('OPENAI_API_KEY')
        
        # Initialize OpenAI client - FIXED for latest version
        self.client = OpenAI(api_key=api_key)
        
        logger.info(f"Initialized O3Mini model: {model_config.get('model', 'unknown')}")

    def generate_content(self, prompt: Union[str, Dict]) -> str:
        """
        Generate content using the O3Mini model.
        
        Args:
            prompt (Union[str, Dict]): Prompt for content generation
            
        Returns:
            str: Generated content
        """
        try:
            # Handle JSON template if provided
            json_template = None
            if isinstance(prompt, dict) and 'json_template' in prompt:
                json_template = prompt.pop('json_template', None)
                
            # Get system message from config
            system_message = self.model_config.get('system_message', '')
            
            # Format messages for OpenAI API
            if isinstance(prompt, list):
                # If prompt is a list of messages, ensure proper formatting
                messages = self._format_messages_for_openai(prompt)
                
                params = {
                    "model": self.model_config['model'],
                    "messages": messages,
                    "max_completion_tokens": self.model_config.get('max_tokens', 4000)  # Use correct parameter
                }
                
                # Add reasoning effort if specified in config
                if "reasoning_effort" in self.model_config:
                    params["reasoning_effort"] = self.model_config["reasoning_effort"]
                    
                response = self.client.chat.completions.create(**params)
                
            # Handle different prompt formats
            elif isinstance(prompt, dict) and "messages" in prompt:
                # Use the provided messages and any response_format
                messages = self._format_messages_for_openai(prompt["messages"])
                
                params = {
                    "model": self.model_config['model'],
                    "messages": messages,
                    "max_completion_tokens": self.model_config.get('max_tokens', 4000)  # Use correct parameter
                }
                
                # Add response format if specified
                if "response_format" in prompt:
                    params["response_format"] = prompt["response_format"]
                    
                # Add reasoning effort if specified in config
                if "reasoning_effort" in self.model_config:
                    params["reasoning_effort"] = self.model_config["reasoning_effort"]
                    
                response = self.client.chat.completions.create(**params)
            else:
                # Wrap the prompt in a messages list
                messages = []
                
                if system_message:
                    messages.append({"role": "system", "content": system_message})
                
                messages.append({
                    "role": "user", 
                    "content": [{"type": "text", "text": prompt if isinstance(prompt, str) else prompt.get("text", "")}]
                })
                
                params = {
                    "model": self.model_config['model'],
                    "messages": messages,
                    "max_completion_tokens": self.model_config.get('max_tokens', 4000)  # Use correct parameter
                }
                
                # Add reasoning effort if specified in config
                if "reasoning_effort" in self.model_config:
                    params["reasoning_effort"] = self.model_config["reasoning_effort"]
                    
                response = self.client.chat.completions.create(**params)
            
            # Extract content from response
            content = response.choices[0].message.content
            
            # Validate content
            if not content or not content.strip():
                raise ValueError("Empty response from O3Mini model.")
                
            # Apply JSON template if provided
            if json_template:
                return self._format_json_response(content, json_template)
                
            return content
            
        except Exception as e:
            logger.error(f"O3Mini model error: {str(e)}")
            raise

    def _format_messages_for_openai(self, messages: List[Dict]) -> List[Dict]:
        """Format messages for OpenAI API compliance"""
        formatted_messages = []
        
        for msg in messages:
            if msg["role"] == "user" and isinstance(msg["content"], str):
                # Format user messages to have array content with type
                formatted_messages.append({
                    "role": msg["role"],
                    "content": [{"type": "text", "text": msg["content"]}]
                })
            else:
                # Leave other messages as they are
                formatted_messages.append(msg)
        
        return formatted_messages


class ClaudeModel(AIModel):
    """Anthropic Claude model implementation"""
    
    def __init__(self, model_config: Dict[str, Any]):
        """
        Initialize the Claude model.
        
        Args:
            model_config (Dict[str, Any]): Model configuration
        """
        super().__init__(model_config)
        
        # Import Anthropic library
        import anthropic
        
        # Get API key from environment
        api_key = self._get_env_var('ANTHROPIC_API_KEY')
        
        # Initialize Anthropic client
        self.client = anthropic.Anthropic(api_key=api_key)
        
        logger.info(f"Initialized Claude model: {model_config.get('model', 'unknown')}")

    def generate_content(self, prompt: Union[str, Dict]) -> str:
        """
        Generate content using the Claude model.
        
        Args:
            prompt (Union[str, Dict]): Prompt for content generation
            
        Returns:
            str: Generated content
        """
        try:
            # Handle JSON template if provided
            json_template = None
            if isinstance(prompt, dict) and 'json_template' in prompt:
                json_template = prompt.pop('json_template', None)
            
            # Modified to handle the message format properly for Claude
            if isinstance(prompt, dict) and "messages" in prompt:
                # Claude API doesn't accept content as an array with type
                # Make sure content is a string for all messages
                cleaned_messages = []
                for msg in prompt["messages"]:
                    if isinstance(msg["content"], list) and len(msg["content"]) > 0 and "text" in msg["content"][0]:
                        # Convert OpenAI format to Claude format
                        cleaned_messages.append({
                            "role": msg["role"],
                            "content": msg["content"][0]["text"]
                        })
                    else:
                        cleaned_messages.append(msg)
                
                # Handle system message differently in Claude
                system_message = None
                filtered_messages = []
                
                for msg in cleaned_messages:
                    if msg["role"] == "system":
                        system_message = msg["content"]
                    else:
                        filtered_messages.append(msg)
                
                # Create parameters for Claude API
                params = {
                    "model": prompt.get("model", self.model_config['model']),
                    "max_tokens": self.model_config['max_tokens'],
                    "temperature": self.model_config['temperature'],
                    "messages": filtered_messages
                }
                
                # Add system message if available
                if system_message:
                    params["system"] = system_message
                    
                response = self.client.messages.create(**params)
                content = response.content[0].text
            
            elif isinstance(prompt, list):
                # Handle list of messages
                system_message = None
                filtered_messages = []
                
                for msg in prompt:
                    if isinstance(msg["content"], list) and len(msg["content"]) > 0 and "text" in msg["content"][0]:
                        # Convert content array to string
                        if msg["role"] == "system":
                            system_message = msg["content"][0]["text"]
                        else:
                            filtered_messages.append({
                                "role": msg["role"],
                                "content": msg["content"][0]["text"]
                            })
                    else:
                        if msg["role"] == "system":
                            system_message = msg["content"]
                        else:
                            filtered_messages.append(msg)
                
                params = {
                    "model": self.model_config['model'],
                    "max_tokens": self.model_config['max_tokens'],
                    "temperature": self.model_config['temperature'],
                    "messages": filtered_messages
                }
                
                if system_message:
                    params["system"] = system_message
                    
                response = self.client.messages.create(**params)
                content = response.content[0].text
            
            else:
                # Handle string prompt
                system_message = self.model_config.get('system_message', '')
                
                # Create message with or without system message
                if system_message:
                    response = self.client.messages.create(
                        model=self.model_config['model'],
                        max_tokens=self.model_config['max_tokens'],
                        temperature=self.model_config['temperature'],
                        system=system_message,
                        messages=[{"role": "user", "content": prompt}]
                    )
                else:
                    # No system message
                    response = self.client.messages.create(
                        model=self.model_config['model'],
                        max_tokens=self.model_config['max_tokens'],
                        temperature=self.model_config['temperature'],
                        messages=[{"role": "user", "content": prompt}]
                    )
                
                content = response.content[0].text
            
            # Apply JSON template if provided
            if json_template:
                return self._format_json_response(content, json_template)
                
            return content
            
        except Exception as e:
            logger.error(f"Claude model error: {str(e)}")
            raise


class GeminiModel(AIModel):
    """Google Gemini model implementation"""
    
    def __init__(self, model_config: Dict[str, Any]):
        """
        Initialize the Gemini model.
        
        Args:
            model_config (Dict[str, Any]): Model configuration
        """
        super().__init__(model_config)
        
        # Import Google GenerativeAI library
        import google.generativeai as genai
        
        # Get API key from environment
        api_key = self._get_env_var('GENAI_API_KEY')
        
        # Configure Google GenerativeAI
        genai.configure(api_key=api_key)
        
        # Initialize Gemini model
        self.model = genai.GenerativeModel(model_config['model'])
        
        logger.info(f"Initialized Gemini model: {model_config.get('model', 'unknown')}")

    def generate_content(self, prompt: Union[str, List]) -> str:
        """
        Generate content using the Gemini model.
        
        Args:
            prompt (Union[str, List]): Prompt for content generation
            
        Returns:
            str: Generated content
        """
        try:
            # Handle JSON template if provided
            json_template = None
            if isinstance(prompt, dict) and 'json_template' in prompt:
                json_template = prompt.pop('json_template', None)
            
            # Get system message from config
            system_message = self.model_config.get('system_message', '')
            
            # Gemini doesn't support message roles like OpenAI and Claude
            # We need to convert to a format Gemini understands
            if isinstance(prompt, list) or (isinstance(prompt, dict) and "messages" in prompt):
                messages = prompt if isinstance(prompt, list) else prompt.get("messages", [])
                
                # Convert message array to a single string for Gemini
                formatted_prompt = ""
                
                # Find system message from messages or use from config
                found_system_message = None
                for msg in messages:
                    if msg.get("role") == "system":
                        content = msg.get("content", "")
                        # Handle OpenAI format
                        if isinstance(content, list) and len(content) > 0 and "text" in content[0]:
                            content = content[0]["text"]
                        found_system_message = content
                        break
                
                # Use found system message or fallback to config
                active_system_message = found_system_message or system_message
                
                # 시스템 메시지를 더 효과적으로 전달하기 위한 방식 변경
                if active_system_message:
                    # 시스템 메시지를 더 명확하게 맨 앞에 배치
                    formatted_prompt += f"System Instructions: {active_system_message}\n\n"
                    # 그리고 사용자에게도 지시
                    formatted_prompt += f"You MUST follow the above system instructions in all your responses.\n\n"
                
                # Process each message
                for msg in messages:
                    role = msg.get("role", "")
                    # 시스템 메시지는 이미 처리했으므로 건너뛰기
                    if role == "system":
                        continue
                        
                    content = msg.get("content", "")
                    
                    # If content is an array (OpenAI format), extract text
                    if isinstance(content, list) and len(content) > 0:
                        if "text" in content[0]:
                            content = content[0]["text"]
                    
                    # Skip empty messages
                    if not content:
                        continue
                        
                    # Add role prefix
                    if role == "user":
                        formatted_prompt += f"User: {content}\n\n"
                    elif role == "assistant":
                        formatted_prompt += f"Assistant: {content}\n\n"
                    else:
                        formatted_prompt += f"{role.capitalize()}: {content}\n\n"
                
                # Add a final assistant prompt
                formatted_prompt += "Assistant: "
                
                # Prepare generation config
                generation_config = {
                    "temperature": self.model_config['temperature'],
                    "top_p": self.model_config.get('top_p', 1),
                    "top_k": self.model_config.get('top_k', 1),
                    "max_output_tokens": self.model_config['max_tokens'],
                }
                
                # Generate content
                response = self.model.generate_content(formatted_prompt, generation_config=generation_config)
                
            elif isinstance(prompt, str):
                # Add system message if available for string prompts
                full_prompt = ""
                if system_message:
                    full_prompt += f"System Instructions: {system_message}\n\n"
                    full_prompt += f"You MUST follow the above system instructions in all your responses.\n\n"
                
                full_prompt += f"User: {prompt}\n\nAssistant: "
                
                # Prepare generation config
                generation_config = {
                    "temperature": self.model_config['temperature'],
                    "top_p": self.model_config.get('top_p', 1),
                    "top_k": self.model_config.get('top_k', 1),
                    "max_output_tokens": self.model_config['max_tokens'],
                }
                
                # Generate content
                response = self.model.generate_content(full_prompt, generation_config=generation_config)
            else:
                # Direct use of provided content (e.g., multimodal)
                generation_config = {
                    "temperature": self.model_config['temperature'],
                    "top_p": self.model_config.get('top_p', 1),
                    "top_k": self.model_config.get('top_k', 1),
                    "max_output_tokens": self.model_config['max_tokens'],
                }
                
                response = self.model.generate_content(prompt, generation_config=generation_config)
            
            # Extract text from response
            content = response.text
            
            # Apply JSON template if provided
            if json_template:
                return self._format_json_response(content, json_template)
                
            return content
            
        except Exception as e:
            logger.error(f"Gemini model error: {str(e)}")
            raise


# Model factory function
def get_model_class(model_type: str, provider_mapping=None) -> Optional[Type[AIModel]]:
    """
    Get the appropriate model class for a given model type.
    
    Args:
        model_type (str): Type of model (specific model name)
        provider_mapping (dict, optional): Mapping of model types to providers
        
    Returns:
        Optional[Type[AIModel]]: Model class or None if not found
    """
    provider = None
    
    # Check if provider_mapping is provided (from config)
    if provider_mapping and model_type in provider_mapping:
        provider = provider_mapping[model_type].get('provider', None)
    
    # Map provider to model class
    provider_to_class = {
        'openai': GPTModel,      # Both GPT and o3-mini are handled by OpenAI
        'anthropic': ClaudeModel,
        'google': GeminiModel,
        'xai': XAIModel
    }
    
    # Special case for o3-mini models - they use the O3MiniModel class
    # Distinguish o3 models based on category in provider_mapping
    if provider == 'openai' and provider_mapping and model_type in provider_mapping:
        category = provider_mapping[model_type].get('category', None)
        if category == 'o3':
            return O3MiniModel
    
    # Return the model class based on provider
    if provider in provider_to_class:
        return provider_to_class[provider]
    
    # If no provider mapping is available or model_type not found, use legacy mapping
    legacy_map = {
        'gpt': GPTModel,
        'o3-mini': O3MiniModel,
        'claude': ClaudeModel,
        'gemini': GeminiModel,
        'grok': XAIModel
    }
    
    return legacy_map.get(model_type)