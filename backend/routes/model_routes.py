from flask import Blueprint, request, jsonify
from services.model_service import ModelService

model_bp = Blueprint('models', __name__)
model_service = ModelService()

@model_bp.route('/list', methods=['GET'])
def list_models():
    """List all available models"""
    models = model_service.list_models()
    
    return jsonify(models)

@model_bp.route('/current', methods=['GET'])
def get_current_model():
    """Get the current model"""
    current_model = model_service.get_current_model()
    
    return jsonify(current_model)

@model_bp.route('/change', methods=['POST'])
def change_model():
    """Change the current model"""
    data = request.json
    
    if not data or 'model_type' not in data:
        return jsonify({"error": "No model type provided"}), 400
    
    model_type = data['model_type']
    is_img_model = data.get('is_img_model', False)
    
    try:
        model_service.change_model(model_type, is_img_model)
        return jsonify({"status": "success"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@model_bp.route('/parameters', methods=['POST'])
def update_model_parameters():
    """Update parameters for a model"""
    data = request.json
    
    if not data or 'model_name' not in data or 'parameters' not in data:
        return jsonify({"error": "Missing model name or parameters"}), 400
    
    model_name = data['model_name']
    parameters = data['parameters']
    
    try:
        model_service.update_model_parameters(model_name, parameters)
        return jsonify({"status": "success"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400