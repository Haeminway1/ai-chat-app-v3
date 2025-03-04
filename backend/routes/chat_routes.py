from flask import Blueprint, request, jsonify
from services.chat_service import ChatService

chat_bp = Blueprint('chat', __name__)
chat_service = ChatService()

@chat_bp.route('/new', methods=['POST'])
def create_chat():
    """Create a new chat"""
    data = request.json or {}
    title = data.get('title', 'New Chat')
    provider = data.get('provider')
    model = data.get('model')
    parameters = data.get('parameters')
    
    chat = chat_service.create_chat(title, provider, model, parameters)
    
    return jsonify(chat.to_dict())

@chat_bp.route('/list', methods=['GET'])
def list_chats():
    """List all chats"""
    chats = chat_service.list_chats()
    
    return jsonify([chat.to_dict() for chat in chats])

@chat_bp.route('/<chat_id>', methods=['GET'])
def get_chat(chat_id):
    """Get a specific chat"""
    chat = chat_service.get_chat(chat_id)
    
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    return jsonify(chat.to_dict())

@chat_bp.route('/<chat_id>/message', methods=['POST'])
def add_message(chat_id):
    """Add a message to a chat and get AI response"""
    data = request.json
    
    if not data or 'content' not in data:
        return jsonify({"error": "No message content provided"}), 400
    
    chat = chat_service.get_chat(chat_id)
    
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    result = chat_service.add_message_and_get_response(chat_id, data['content'])
    
    return jsonify(result)

@chat_bp.route('/<chat_id>/system', methods=['POST'])
def update_system_message(chat_id):
    """Update system message for a chat"""
    data = request.json
    
    if not data or 'content' not in data:
        return jsonify({"error": "No system message content provided"}), 400
    
    chat = chat_service.get_chat(chat_id)
    
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    result = chat_service.update_system_message(chat_id, data['content'])
    
    return jsonify(result)

@chat_bp.route('/<chat_id>/title', methods=['POST'])
def update_chat_title(chat_id):
    """Update the title of a chat"""
    data = request.json
    
    if not data or 'title' not in data:
        return jsonify({"error": "No title provided"}), 400
    
    chat = chat_service.get_chat(chat_id)
    
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    result = chat_service.update_chat_title(chat_id, data['title'])
    
    return jsonify(result)

@chat_bp.route('/<chat_id>/model', methods=['POST'])
def update_chat_model(chat_id):
    """Update the model of a chat"""
    data = request.json
    
    if not data or 'model' not in data:
        return jsonify({"error": "No model provided"}), 400
    
    chat = chat_service.get_chat(chat_id)
    
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    result = chat_service.update_chat_model(chat_id, data['model'])
    
    return jsonify(result)

@chat_bp.route('/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    """Delete a chat"""
    success = chat_service.delete_chat(chat_id)
    
    if not success:
        return jsonify({"error": "Chat not found"}), 404
    
    return jsonify({"status": "success"})
