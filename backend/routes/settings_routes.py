from flask import Blueprint, request, jsonify
from services.settings_service import SettingsService

settings_bp = Blueprint('settings', __name__)
settings_service = SettingsService()

@settings_bp.route('/json_mode', methods=['GET'])
def get_json_mode():
    """Get JSON mode status"""
    json_mode = settings_service.get_json_mode()
    
    return jsonify({"json_mode": json_mode})

@settings_bp.route('/json_mode', methods=['POST'])
def set_json_mode():
    """Set JSON mode"""
    data = request.json
    
    if not data or 'enabled' not in data:
        return jsonify({"error": "No enabled status provided"}), 400
    
    enabled = data['enabled']
    settings_service.set_json_mode(enabled)
    
    return jsonify({"status": "success"})

@settings_bp.route('/system_prompts', methods=['GET'])
def list_system_prompts():
    """List all system prompts"""
    prompts = settings_service.list_system_prompts()
    
    return jsonify(prompts)

@settings_bp.route('/system_prompts/<model_type>', methods=['POST'])
def set_system_prompt(model_type):
    """Set system prompt for a model"""
    data = request.json
    
    if not data or 'prompt_key' not in data:
        return jsonify({"error": "No prompt key provided"}), 400
    
    prompt_key = data['prompt_key']
    
    try:
        settings_service.set_system_prompt(model_type, prompt_key)
        return jsonify({"status": "success"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@settings_bp.route('/system_prompts', methods=['POST'])
def add_system_prompt():
    """Add a new system prompt"""
    data = request.json
    
    if not data or 'key' not in data or 'prompt' not in data:
        return jsonify({"error": "Missing key or prompt"}), 400
    
    key = data['key']
    prompt = data['prompt']
    
    settings_service.add_system_prompt(key, prompt)
    
    return jsonify({"status": "success"})