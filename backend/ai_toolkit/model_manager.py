import os
import yaml
import base64
import json
import logging
from typing import Dict, Any, Optional, List, Union
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self, config_dir: str = None):
        """
        Initialize the ModelManager with configuration files.
        
        Args:
            config_dir (str, optional): Directory containing config files. Defaults to './configs/'.
        """
        # Set default config directory if not provided
        self.config_dir = config_dir or os.path.join(os.path.dirname(__file__), 'configs')
        
        # Ensure config directory exists
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Define config file paths
        self.config_path = os.path.join(self.config_dir, 'config.yaml')
        self.prompt_path = os.path.join(self.config_dir, 'prompt.yaml')
        self.json_template_path = os.path.join(self.config_dir, 'json_template.yaml')
        
        # Load configurations
        self.config = self._load_config(self.config_path)
        self.prompts = self._load_config(self.prompt_path)
        self.json_templates = self._load_config(self.json_template_path)
        
        # Initialize model instances
        self.current_model = None
        self.current_img_model = None
        
        # Don't initialize models at startup to avoid API key errors
        # Models will be initialized on-demand when needed
        logger.info(f"ModelManager initialized with configurations loaded")

    def _load_config(self, config_path: str) -> Dict:
        """
        Load configuration from YAML file, or create default if not exists.
        
        Args:
            config_path (str): Path to the configuration file
            
        Returns:
            Dict: Configuration dictionary
        """
        if not os.path.exists(config_path):
            # Create default config files based on file path
            if 'config.yaml' in config_path:
                self._create_default_config()
            elif 'prompt.yaml' in config_path:
                self._create_default_prompts()
            elif 'json_template.yaml' in config_path:
                self._create_default_json_templates()
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            logger.error(f"Error loading config from {config_path}: {e}")
            # Return empty dict as fallback
            return {}

    def _create_default_config(self):
        """Create default configuration file"""
        default_config = {
            'current_model': 'gpt-4o',
            'current_img_model': 'gpt-4o',
            'json_mode': False,
            'providers': {
                'openai': {
                    'gpt': ['gpt-4', 'gpt-4o', 'gpt-4.5'],
                    'o3': ['o3-mini']
                },
                'anthropic': {
                    'claude': ['claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest']
                },
                'google': {
                    'gemini': ['gemini-2.0-flash', 'gemini-1.5-pro']
                }
            },
            'provider_mapping': {
                'gpt-4': {'provider': 'openai', 'category': 'gpt'},
                'gpt-4o': {'provider': 'openai', 'category': 'gpt'},
                'gpt-4.5': {'provider': 'openai', 'category': 'gpt'},
                'o3-mini': {'provider': 'openai', 'category': 'o3'},
                'claude-3-7-sonnet-latest': {'provider': 'anthropic', 'category': 'claude'},
                'claude-3-5-haiku-latest': {'provider': 'anthropic', 'category': 'claude'},
                'gemini-2.0-flash': {'provider': 'google', 'category': 'gemini'},
                'gemini-1.5-pro': {'provider': 'google', 'category': 'gemini'}
            },
            'models': {
                'gpt-4o': {
                    'provider': 'openai',
                    'category': 'gpt',
                    'model': 'gpt-4o',
                    'max_tokens': 4000,
                    'temperature': 0.7,
                    'system_prompt_key': 'default_system',
                    'supports_system_prompt': True
                },
                'o3-mini': {
                    'provider': 'openai',
                    'category': 'o3',
                    'model': 'o3-mini',
                    'max_tokens': 45000,
                    'temperature': 0.7,
                    'reasoning_effort': 'high',
                    'system_prompt_key': 'default_system',
                    'supports_system_prompt': False
                },
                'claude-3-7-sonnet-latest': {
                    'provider': 'anthropic',
                    'category': 'claude',
                    'model': 'claude-3-7-sonnet-20240229',
                    'max_tokens': 4000,
                    'temperature': 0.7,
                    'system_prompt_key': 'default_system',
                    'supports_system_prompt': True
                },
                'gemini-2.0-flash': {
                    'provider': 'google',
                    'category': 'gemini',
                    'model': 'gemini-2.0-flash',
                    'max_tokens': 4000,
                    'temperature': 0.7,
                    'system_prompt_key': 'default_system',
                    'supports_system_prompt': True
                }
            }
        }
        
        self._save_config(self.config_path, default_config)

    def _create_default_prompts(self):
        """Create default prompts file"""
        default_prompts = {
            'system_prompts': {
                'default_system': 'You are a helpful, accurate, and friendly AI assistant.',
                'creative_system': 'You are a creative AI assistant that excels at generating imaginative content.',
                'technical_system': 'You are a technical AI assistant that provides precise and accurate information.'
            },
            'user_prompts': {
                'explain_ai': 'Explain the concept of artificial intelligence.',
                'write_story': 'Write a short story about a character who discovers something unexpected.'
            }
        }
        self._save_config(self.prompt_path, default_prompts)

    def _create_default_json_templates(self):
        """Create default JSON templates file"""
        default_templates = {
            'json_template': {
                'default': {
                    'response': '',
                    'metadata': {
                        'model': '',
                        'timestamp': ''
                    }
                },
                'detailed': {
                    'response': {
                        'content': '',
                        'summary': ''
                    },
                    'metadata': {
                        'model': '',
                        'timestamp': '',
                        'processing_time': ''
                    }
                }
            }
        }
        self._save_config(self.json_template_path, default_templates)

    def _save_config(self, config_path: str, config_data: Dict):
        """
        Save configuration to a YAML file.
        
        Args:
            config_path (str): Path to save the configuration file
            config_data (Dict): Configuration data to save
        """
        try:
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            with open(config_path, 'w', encoding='utf-8') as f:
                yaml.dump(config_data, f, default_flow_style=False, allow_unicode=True)
            logger.info(f"Created default configuration at {config_path}")
        except Exception as e:
            logger.error(f"Error saving config to {config_path}: {e}")

    def _initialize_models(self):
        """Initialize model instances based on current configuration"""
        # Import here to avoid circular imports
        from .ai_models import get_model_class
        
        try:
            # Get current model types from config
            model_type = self.config.get('current_model', 'gpt')
            img_model_type = self.config.get('current_img_model', model_type)
            
            # Get model configurations
            model_config = self.config.get('models', {}).get(model_type, {})
            img_model_config = self.config.get('models', {}).get(img_model_type, {})
            
            # Get provider mapping
            provider_mapping = self.config.get('provider_mapping', {})
            
            # Inject system prompts if configured
            if 'system_prompt_key' in model_config:
                prompt_key = model_config['system_prompt_key']
                system_prompt = self.prompts.get('system_prompts', {}).get(prompt_key, '')
                model_config['system_message'] = system_prompt
                
            if 'system_prompt_key' in img_model_config:
                prompt_key = img_model_config['system_prompt_key']
                system_prompt = self.prompts.get('system_prompts', {}).get(prompt_key, '')
                img_model_config['system_message'] = system_prompt
            
            # Get appropriate model classes with provider mapping
            model_class = get_model_class(model_type, provider_mapping)
            img_model_class = get_model_class(img_model_type, provider_mapping)
            
            if model_class is None:
                raise ValueError(f"Unsupported model type: {model_type}")
                
            if img_model_class is None:
                raise ValueError(f"Unsupported image model type: {img_model_type}")
            
            # Check for required API keys before creating model instances
            provider = model_config.get('provider', '')
            img_provider = img_model_config.get('provider', '')
            
            # Only create model instances if required API keys are available
            self.current_model = None
            self.current_img_model = None
            
            try:
                # Create model instances only if API keys are available
                if provider == 'openai' and os.getenv('OPENAI_API_KEY'):
                    self.current_model = model_class(model_config)
                    logger.info(f"Initialized {model_type} model with provider {provider}")
                elif provider == 'anthropic' and os.getenv('ANTHROPIC_API_KEY'):
                    self.current_model = model_class(model_config)
                    logger.info(f"Initialized {model_type} model with provider {provider}")
                elif provider == 'google' and os.getenv('GENAI_API_KEY'):
                    self.current_model = model_class(model_config)
                    logger.info(f"Initialized {model_type} model with provider {provider}")
                    
                # Initialize image model if API key is available
                if img_provider == 'openai' and os.getenv('OPENAI_API_KEY'):
                    self.current_img_model = img_model_class(img_model_config)
                    logger.info(f"Initialized {img_model_type} image model with provider {img_provider}")
                elif img_provider == 'anthropic' and os.getenv('ANTHROPIC_API_KEY'):
                    self.current_img_model = img_model_class(img_model_config)
                    logger.info(f"Initialized {img_model_type} image model with provider {img_provider}")
                elif img_provider == 'google' and os.getenv('GENAI_API_KEY'):
                    self.current_img_model = img_model_class(img_model_config)
                    logger.info(f"Initialized {img_model_type} image model with provider {img_provider}")
            except Exception as e:
                logger.warning(f"Some models couldn't be initialized: {e}")
                # Continue anyway - we'll check for None models when generating content
                    
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            # Don't raise - this allows the app to start even if model initialization fails
            # We'll check for None models when generating content

    def change_model(self, model_type: str, is_img_model: bool = False):
        """
        Change the current model to the specified type.
        
        Args:
            model_type (str): Type of model to change to
            is_img_model (bool, optional): Whether to change the image model. Defaults to False.
        """
        if model_type not in self.config.get('models', {}):
            raise ValueError(f"Unsupported model type: {model_type}")
        
        # Update config
        if is_img_model:
            self.config['current_img_model'] = model_type
        else:
            self.config['current_model'] = model_type
        
        # Save updated config
        self._save_config(self.config_path, self.config)
        
        # Reinitialize models
        self._initialize_models()
        
        logger.info(f"Changed {'image ' if is_img_model else ''}model to {model_type}")

    def set_json_mode(self, enabled: bool = True):
        """
        Enable or disable JSON mode.
        
        Args:
            enabled (bool, optional): Whether to enable JSON mode. Defaults to True.
        """
        self.config['json_mode'] = enabled
        self._save_config(self.config_path, self.config)
        logger.info(f"JSON mode {'enabled' if enabled else 'disabled'}")

    def get_current_model(self) -> str:
        """
        Get the current model type.
        
        Returns:
            str: Current model type
        """
        return self.config.get('current_model', 'gpt')
    # Method to get all model configs
    def get_all_model_configs(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all model configurations
        
        Returns:
            Dict[str, Dict[str, Any]]: Dictionary of model configurations
        """
        return self.config.get('models', {})

    # Method to get a specific model's config
    def get_model_config(self, model_name: str) -> Optional[Dict[str, Any]]:
        """
        Get configuration for a specific model
        
        Args:
            model_name (str): Model name
        
        Returns:
            Optional[Dict[str, Any]]: Model configuration or None if not found
        """
        return self.config.get('models', {}).get(model_name)
    
    def get_current_img_model(self) -> str:
        """
        Get the current image model type.
        
        Returns:
            str: Current image model type
        """
        return self.config.get('current_img_model', self.config.get('current_model', 'gpt'))
    
    def get_parameters(self, provider: str, model: str) -> Dict[str, Any]:
        """
        Get parameters for a specific model
        
        Args:
            provider (str): Provider name
            model (str): Model name
                
        Returns:
            Dict[str, Any]: Model parameters
        """
        # If model is a key in our config, use that directly
        if model in self.config.get('models', {}):
            model_config = self.config.get('models', {}).get(model, {})
            return {
                'model': model_config.get('model', ''),
                'max_tokens': model_config.get('max_tokens', 4000),
                'temperature': model_config.get('temperature', 0.7),
                'supports_system_prompt': model_config.get('supports_system_prompt', True)
            }
        
        # Otherwise, provide default params
        return {
            'model': model,
            'max_tokens': 4000,
            'temperature': 0.7,
            'supports_system_prompt': True
        }

    def _prepare_json_template(self, model_type: str) -> Dict:
        """
        Prepare JSON template with metadata.
        
        Args:
            model_type (str): Current model type
            
        Returns:
            Dict: Prepared JSON template
        """
        # Get template from config or use default
        template_name = self.config.get('models', {}).get(model_type, {}).get('json_template', 'default')
        template = self.json_templates.get('json_template', {}).get(template_name, {})
        
        if not template:
            # Fallback to minimal template
            template = {
                'response': '',
                'metadata': {
                    'model': model_type,
                    'timestamp': datetime.now().isoformat()
                }
            }
        
        # Fill in metadata
        if 'metadata' in template:
            template['metadata']['model'] = model_type
            template['metadata']['timestamp'] = datetime.now().isoformat()
            
        return template

    def generate_content(self, prompt: Union[str, Dict], use_img_model: bool = False) -> str:
        """
        Generate content from the current model using the provided prompt.
        
        Args:
            prompt (Union[str, Dict]): Prompt for content generation
            use_img_model (bool, optional): Whether to use the image model. Defaults to False.
            
        Returns:
            str: Generated content
        """
        # Determine which model to use
        model_type = self.get_current_img_model() if use_img_model else self.get_current_model()
        provider = self.config.get('models', {}).get(model_type, {}).get('provider', '')
        
        # Try to initialize models if they aren't already initialized
        if self.current_model is None or self.current_img_model is None:
            try:
                self._initialize_models()
            except Exception as e:
                logger.warning(f"Model initialization attempt failed: {e}")
                # Continue - we'll check the specific model below
        
        # Get the appropriate model based on use_img_model flag
        model = self.current_img_model if use_img_model else self.current_model
        
        # Check if required model is available
        if model is None:
            # Check which API key is missing
            if provider == 'openai':
                api_key = os.getenv('OPENAI_API_KEY')
                if not api_key:
                    return f"Error: OpenAI API key not found. Please provide an API key for {provider}."
            elif provider == 'anthropic':
                api_key = os.getenv('ANTHROPIC_API_KEY')
                if not api_key:
                    return f"Error: Anthropic API key not found. Please provide an API key for {provider}."
            elif provider == 'google':
                api_key = os.getenv('GENAI_API_KEY')
                if not api_key:
                    return f"Error: Google AI API key not found. Please provide an API key for {provider}."
            return f"Error: Model {model_type} could not be initialized. Please check API keys and try again."
        
        # Check for JSON mode
        json_mode = self.config.get('json_mode', False)
        
        # Format messages based on provider
        formatted_prompt = self._format_prompt_for_provider(prompt, provider, model_type, json_mode)
        
        try:
            # Generate content
            response = model.generate_content(formatted_prompt)
            
            # Process JSON response if in JSON mode
            if json_mode:
                try:
                    # Try to parse JSON response
                    parsed = json.loads(response)
                    
                    # Check if parsed response matches expected template structure
                    if isinstance(parsed, dict) and not ('response' in parsed or 'metadata' in parsed):
                        # If response doesn't match template, wrap it in template
                        template = self._prepare_json_template(model_type)
                        if isinstance(template, dict) and 'response' in template:
                            template['response'] = parsed
                            response = json.dumps(template, ensure_ascii=False, indent=2)
                        else:
                            # Fallback if template is invalid
                            response = json.dumps({
                                'response': parsed,
                                'metadata': {
                                    'model': model_type,
                                    'timestamp': datetime.now().isoformat()
                                }
                            }, ensure_ascii=False, indent=2)
                    else:
                        # Format JSON response consistently
                        response = json.dumps(parsed, ensure_ascii=False, indent=2)
                except json.JSONDecodeError:
                    # If response is not valid JSON, wrap it in template
                    template = self._prepare_json_template(model_type)
                    if isinstance(template, dict) and 'response' in template:
                        template['response'] = response
                        response = json.dumps(template, ensure_ascii=False, indent=2)
                    else:
                        # Fallback if template is invalid
                        response = json.dumps({
                            'response': response,
                            'metadata': {
                                'model': model_type,
                                'timestamp': datetime.now().isoformat(),
                                'error': 'Response is not valid JSON'
                            }
                        }, ensure_ascii=False, indent=2)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating content: {e}")
            error_msg = str(e)
            
            # Check for specific API key errors
            if "API key" in error_msg.lower() or "apikey" in error_msg.lower() or "authentication" in error_msg.lower() or "auth" in error_msg.lower():
                error_msg = f"API key error for {provider}: {error_msg}. Please check your API key settings."
            
            if json_mode:
                return json.dumps({
                    'error': error_msg,
                    'metadata': {
                        'model': model_type,
                        'timestamp': datetime.now().isoformat()
                    }
                }, ensure_ascii=False, indent=2)
            else:
                return f"Error generating content: {error_msg}"

    def _format_prompt_for_provider(self, prompt, provider, model_type, json_mode=False):
        """Format the prompt based on the provider's requirements"""
        # If already formatted correctly, return as is
        if isinstance(prompt, dict) and "messages" in prompt:
            # For OpenAI, ensure user messages have the right format
            if provider == 'openai':
                for i, message in enumerate(prompt["messages"]):
                    if message.get("role") == "user" and isinstance(message.get("content"), str):
                        prompt["messages"][i]["content"] = [{"type": "text", "text": message["content"]}]
            return prompt
        
        # If it's a list of messages
        if isinstance(prompt, list):
            # For OpenAI, ensure user messages have the right format
            if provider == 'openai':
                for i, message in enumerate(prompt):
                    if message.get("role") == "user" and isinstance(message.get("content"), str):
                        prompt[i]["content"] = [{"type": "text", "text": message["content"]}]
            return prompt
        
        # If it's a string, convert to proper format
        if isinstance(prompt, str):
            system_message = self.current_model.model_config.get('system_message', '') if self.current_model else ''
            
            if provider == 'openai':
                messages = []
                if system_message:
                    messages.append({"role": "system", "content": system_message})
                messages.append({
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}]
                })
                return {"messages": messages}
            
            elif provider == 'anthropic':
                if system_message:
                    return {
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "system": system_message
                    }
                else:
                    return {
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    }
            
            # For other providers, return as is
            return prompt
        
        # Default case, return unchanged
        return prompt
    
    def generate_content_with_image(self, prompt: str, image_path: str) -> str:
        """
        Generate content using the current image model with an image.
        
        Args:
            prompt (str): Text prompt for content generation
            image_path (str): Path to the image file
            
        Returns:
            str: Generated content
        """
        model_type = self.get_current_img_model()
        json_mode = self.config.get('json_mode', False)
        
        # Try to initialize models if they aren't already initialized
        if self.current_img_model is None:
            try:
                self._initialize_models()
            except Exception as e:
                logger.warning(f"Model initialization attempt failed: {e}")
        
        # Check if image model is available
        if self.current_img_model is None:
            provider = self.config.get('models', {}).get(model_type, {}).get('provider', '')
            if provider == 'openai':
                return f"Error: OpenAI API key not found. Please provide an API key for {provider}."
            elif provider == 'anthropic':
                return f"Error: Anthropic API key not found. Please provide an API key for {provider}."
            elif provider == 'google':
                return f"Error: Google AI API key not found. Please provide an API key for {provider}."
            return f"Error: Image model could not be initialized. Please check API keys and try again."
        
        try:
            # Read image file
            with open(image_path, "rb") as f:
                image_data = f.read()
            
            # Prepare based on model provider
            provider = self.config.get('models', {}).get(model_type, {}).get('provider', '')
            
            if provider == 'google':
                # Gemini model handling
                import google.generativeai.types as types
                image_part = types.Part.from_bytes(image_data, "image/jpeg")
                contents = [prompt, image_part]
                response = self.current_img_model.generate_content(contents)
            else:
                # OpenAI (GPT, O3Mini) and Claude handling
                base64_data = base64.b64encode(image_data).decode("utf-8")
                image_url = f"data:image/jpeg;base64,{base64_data}"
                
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    }
                ]
                
                # Add system message if available
                system_message = self.current_img_model.model_config.get('system_message', '')
                if system_message:
                    messages.insert(0, {"role": "system", "content": system_message})
                
                payload = {
                    "model": self.current_img_model.model_config.get("model"),
                    "messages": messages,
                    "max_tokens": self.current_img_model.model_config.get("max_tokens"),
                    "temperature": self.current_img_model.model_config.get("temperature")
                }
                
                # Add JSON formatting if enabled
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}
                    template = self._prepare_json_template(model_type)
                    payload["json_template"] = template
                
                response = self.current_img_model.generate_content(payload)
            
            # Process JSON response if in JSON mode
            if json_mode:
                try:
                    parsed = json.loads(response)
                    response = json.dumps(parsed, ensure_ascii=False, indent=2)
                except json.JSONDecodeError:
                    # If response is not valid JSON, wrap it in template
                    template = self._prepare_json_template(model_type)
                    if isinstance(template, dict) and 'response' in template:
                        template['response'] = response
                        response = json.dumps(template, ensure_ascii=False, indent=2)
                    else:
                        # Fallback if template is invalid
                        response = json.dumps({
                            'response': response,
                            'metadata': {
                                'model': model_type,
                                'timestamp': datetime.now().isoformat(),
                                'error': 'Response is not valid JSON'
                            }
                        }, ensure_ascii=False, indent=2)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating content with image: {e}")
            if json_mode:
                return json.dumps({
                    'error': str(e),
                    'metadata': {
                        'model': model_type,
                        'timestamp': datetime.now().isoformat()
                    }
                }, ensure_ascii=False, indent=2)
            else:
                return f"Error generating content with image: {str(e)}"

    def list_available_models(self) -> Dict[str, Any]:
        """
        List all available models by provider and category.
        
        Returns:
            Dict[str, Any]: Hierarchical dictionary of providers, categories, and models
        """
        return self.config.get('providers', {})

    def list_system_prompts(self) -> List[str]:
        """
        List available system prompt keys.
        
        Returns:
            List[str]: List of system prompt keys
        """
        return list(self.prompts.get('system_prompts', {}).keys())

    def set_system_prompt(self, model_type: str, prompt_key: str):
        """
        Set system prompt for a specific model.
        
        Args:
            model_type (str): Model type to set prompt for
            prompt_key (str): Key of the system prompt to use
        """
        if model_type not in self.config.get('models', {}):
            raise ValueError(f"Unsupported model type: {model_type}")
            
        if prompt_key not in self.prompts.get('system_prompts', {}):
            raise ValueError(f"Unknown system prompt key: {prompt_key}")
        
        # Update config
        self.config['models'][model_type]['system_prompt_key'] = prompt_key
        self._save_config(self.config_path, self.config)
        
        # Reinitialize models
        self._initialize_models()
        
        logger.info(f"Set system prompt for {model_type} to {prompt_key}")

    def add_system_prompt(self, key: str, prompt: str):
        """
        Add a new system prompt.
        
        Args:
            key (str): Key for the new system prompt
            prompt (str): System prompt text
        """
        if 'system_prompts' not in self.prompts:
            self.prompts['system_prompts'] = {}
            
        self.prompts['system_prompts'][key] = prompt
        self._save_config(self.prompt_path, self.prompts)
        
        logger.info(f"Added system prompt: {key}")
