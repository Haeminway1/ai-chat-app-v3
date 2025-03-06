from flask import Blueprint, request, jsonify
from services.loop_service import LoopService

loop_bp = Blueprint('loop', __name__)
loop_service = LoopService()

@loop_bp.route('/new', methods=['POST'])
def create_loop():
    """Create a new loop"""
    data = request.json or {}
    title = data.get('title', 'New Loop')
    
    loop = loop_service.create_loop(title)
    
    return jsonify(loop.to_dict())

@loop_bp.route('/list', methods=['GET'])
def list_loops():
    """List all loops"""
    loops = loop_service.list_loops()
    
    return jsonify([loop.to_dict() for loop in loops])

@loop_bp.route('/<loop_id>', methods=['GET'])
def get_loop(loop_id):
    """Get a specific loop"""
    loop = loop_service.get_loop(loop_id)
    
    if not loop:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify(loop.to_dict())

@loop_bp.route('/<loop_id>/title', methods=['POST'])
def update_loop_title(loop_id):
    """Update the title of a loop"""
    data = request.json
    
    if not data or 'title' not in data:
        return jsonify({"error": "No title provided"}), 400
    
    loop = loop_service.update_loop_title(loop_id, data['title'])
    
    if not loop:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify(loop.to_dict())

@loop_bp.route('/<loop_id>', methods=['DELETE'])
def delete_loop(loop_id):
    """Delete a loop"""
    success = loop_service.delete_loop(loop_id)
    
    if not success:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({"status": "success"})

@loop_bp.route('/<loop_id>/participant', methods=['POST'])
def add_participant(loop_id):
    """Add a participant to a loop"""
    data = request.json
    
    if not data or 'model' not in data:
        return jsonify({"error": "Model not provided"}), 400
    
    system_prompt = data.get('system_prompt', '')
    display_name = data.get('display_name')
    
    result = loop_service.add_participant(loop_id, data['model'], system_prompt, display_name)
    
    if not result:
        return jsonify({"error": "Loop not found"}), 404
    
    loop, participant = result
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict(),
        "participant": participant.to_dict()
    })

@loop_bp.route('/<loop_id>/participant/<participant_id>', methods=['PUT'])
def update_participant(loop_id, participant_id):
    """Update a participant in a loop"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Filter valid updates
    valid_fields = {'model', 'system_prompt', 'display_name'}
    updates = {k: v for k, v in data.items() if k in valid_fields}
    
    result = loop_service.update_participant(loop_id, participant_id, updates)
    
    if not result:
        return jsonify({"error": "Loop or participant not found"}), 404
    
    loop, participant = result
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict(),
        "participant": participant.to_dict()
    })

@loop_bp.route('/<loop_id>/participant/<participant_id>', methods=['DELETE'])
def remove_participant(loop_id, participant_id):
    """Remove a participant from a loop"""
    loop = loop_service.remove_participant(loop_id, participant_id)
    
    if not loop:
        return jsonify({"error": "Loop or participant not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict()
    })

@loop_bp.route('/<loop_id>/reorder', methods=['POST'])
def reorder_participants(loop_id):
    """Reorder participants in a loop"""
    data = request.json
    
    if not data or 'participant_ids' not in data:
        return jsonify({"error": "No participant_ids provided"}), 400
    
    loop = loop_service.reorder_participants(loop_id, data['participant_ids'])
    
    if not loop:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict()
    })

@loop_bp.route('/<loop_id>/start', methods=['POST'])
def start_loop(loop_id):
    """Start a loop with an initial prompt"""
    data = request.json
    
    if not data or 'initial_prompt' not in data:
        return jsonify({"error": "No initial prompt provided"}), 400
    
    loop = loop_service.start_loop(loop_id, data['initial_prompt'])
    
    if not loop:
        return jsonify({"error": "Loop not found or has no participants"}), 404
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict()
    })

@loop_bp.route('/<loop_id>/pause', methods=['POST'])
def pause_loop(loop_id):
    """Pause a running loop"""
    loop = loop_service.pause_loop(loop_id)
    
    if not loop:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict()
    })

@loop_bp.route('/<loop_id>/resume', methods=['POST'])
def resume_loop(loop_id):
    """Resume a paused loop"""
    loop = loop_service.resume_loop(loop_id)
    
    if not loop:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict()
    })

@loop_bp.route('/<loop_id>/stop', methods=['POST'])
def stop_loop(loop_id):
    """Stop a running loop"""
    loop = loop_service.stop_loop(loop_id)
    
    if not loop:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict()
    })

@loop_bp.route('/<loop_id>/reset', methods=['POST'])
def reset_loop(loop_id):
    """Reset a loop to its initial state"""
    loop = loop_service.reset_loop(loop_id)
    
    if not loop:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict()
    })