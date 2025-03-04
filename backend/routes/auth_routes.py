from flask import Blueprint, request, jsonify
import os
import json

auth_bp = Blueprint('auth', __name__)

# File to store API keys
API_KEYS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'api_keys.json')

def ensure_data_dir():
    """Ensure data directory exists"""
    os.makedirs(os.path.dirname(API_KEYS_FILE), exist_ok=True)

def get_api_keys():
    """Get stored API keys"""
    ensure_data_dir()
    if not os.path.exists(API_KEYS_FILE):
        return {}
    
    try:
        with open(API_KEYS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_api_keys(api_keys):
    """Save API keys to file"""
    ensure_data_dir()
    try:
        with open(API_KEYS_FILE, 'w') as f:
            json.dump(api_keys, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving API keys: {e}")
        return False

@auth_bp.route('/keys', methods=['GET'])
def get_keys():
    """Get API key status (only if they exist, not the actual keys)"""
    api_keys = get_api_keys()
    
    # Return only which keys are set, not the actual keys
    key_status = {
        'openai': 'OPENAI_API_KEY' in api_keys and bool(api_keys['OPENAI_API_KEY']),
        'anthropic': 'ANTHROPIC_API_KEY' in api_keys and bool(api_keys['ANTHROPIC_API_KEY']),
        'google': 'GENAI_API_KEY' in api_keys and bool(api_keys['GENAI_API_KEY']),
        'xai': 'XAI_API_KEY' in api_keys and bool(api_keys['XAI_API_KEY'])
    }
    
    return jsonify(key_status)

@auth_bp.route('/keys', methods=['POST'])
def save_keys():
    """Save API keys"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Get existing API keys
    api_keys = get_api_keys()
    
    # Flag to check if at least one key is provided or exists
    any_key_set = False
    
    # Update API keys only if they have a value (not empty string)
    for key, value in data.items():
        if key in ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GENAI_API_KEY', 'XAI_API_KEY']:
            if value:  # Only update if value is not empty
                api_keys[key] = value
                # Also set as environment variable for the current session
                os.environ[key] = value
                any_key_set = True
            # Don't overwrite existing keys with empty values
    
    # Check if at least one key is set (including existing keys)
    if not any_key_set:
        any_key_set = any(
            key in api_keys and api_keys[key] 
            for key in ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GENAI_API_KEY', 'XAI_API_KEY']
        )
    
    if not any_key_set:
        return jsonify({"error": "Please provide at least one API key"}), 400
    
    # Save the keys and check if it was successful
    if save_api_keys(api_keys):
        return jsonify({"status": "success"})
    else:
        return jsonify({"error": "Failed to save API keys"}), 500

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    """Check if API keys are set up"""
    api_keys = get_api_keys()
    
    # Load API keys into environment variables if not already set
    for key, value in api_keys.items():
        if key not in os.environ and value:
            os.environ[key] = value
    
    # Consider user authenticated if any key is set
    any_key_set = any(
        key in api_keys and api_keys[key] 
        for key in ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GENAI_API_KEY', 'XAI_API_KEY']
    )
    
    return jsonify({
        "authenticated": any_key_set
    })