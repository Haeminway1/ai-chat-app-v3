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
    user_prompt = data.get('user_prompt', '')
    
    # Extract temperature and max_tokens with default values
    try:
        temperature = float(data.get('temperature', 0.7))
    except (ValueError, TypeError):
        temperature = 0.7
    
    try:
        max_tokens = int(data.get('max_tokens', 4000))
    except (ValueError, TypeError):
        max_tokens = 4000
    
    result = loop_service.add_participant(
        loop_id, 
        data['model'], 
        system_prompt, 
        display_name, 
        user_prompt,
        temperature,
        max_tokens
    )
    
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
    
    # Filter valid updates - ensure temperature and max_tokens are included in valid fields
    valid_fields = {'model', 'system_prompt', 'display_name', 'user_prompt', 'temperature', 'max_tokens'}
    updates = {k: v for k, v in data.items() if k in valid_fields}
    
    # Ensure numeric fields are properly converted
    if 'temperature' in updates:
        try:
            updates['temperature'] = float(updates['temperature'])
        except (ValueError, TypeError):
            updates['temperature'] = 0.7  # Default if conversion fails
    
    if 'max_tokens' in updates:
        try:
            updates['max_tokens'] = int(updates['max_tokens'])
        except (ValueError, TypeError):
            updates['max_tokens'] = 4000  # Default if conversion fails
    
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

@loop_bp.route('/<loop_id>/loop_prompt', methods=['PUT'])
def update_loop_prompt(loop_id):
    """Update the loop user prompt"""
    data = request.json
    
    if not data or 'loop_user_prompt' not in data:
        return jsonify({"error": "No loop_user_prompt provided"}), 400
    
    loop = loop_service.update_loop_prompt(loop_id, data['loop_user_prompt'])
    
    if not loop:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": loop.to_dict()
    })

@loop_bp.route('/<loop_id>/stop_sequence', methods=['POST'])
def add_stop_sequence(loop_id):
    """Add a stop sequence to a loop"""
    data = request.json
    
    if not data or 'model' not in data:
        return jsonify({"error": "Model not provided"}), 400
    
    system_prompt = data.get('system_prompt', '')
    display_name = data.get('display_name')
    stop_condition = data.get('stop_condition', '')
    
    result = loop_service.add_stop_sequence(loop_id, data['model'], system_prompt, display_name, stop_condition)
    
    if not result:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": result["loop"].to_dict()
    })

@loop_bp.route('/<loop_id>/stop_sequence/<stop_sequence_id>', methods=['PUT'])
def update_stop_sequence(loop_id, stop_sequence_id):
    """Update a stop sequence in a loop"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Filter valid updates
    valid_fields = {'model', 'system_prompt', 'display_name', 'stop_condition'}
    updates = {k: v for k, v in data.items() if k in valid_fields}
    
    result = loop_service.update_stop_sequence(loop_id, stop_sequence_id, updates)
    
    if not result:
        return jsonify({"error": "Loop or stop sequence not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": result["loop"].to_dict()
    })

@loop_bp.route('/<loop_id>/stop_sequence/<stop_sequence_id>', methods=['DELETE'])
def remove_stop_sequence(loop_id, stop_sequence_id):
    """Remove a stop sequence from a loop"""
    result = loop_service.remove_stop_sequence(loop_id, stop_sequence_id)
    
    if not result:
        return jsonify({"error": "Loop or stop sequence not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": result["loop"].to_dict()
    })

@loop_bp.route('/<loop_id>/reorder_stop_sequences', methods=['POST'])
def reorder_stop_sequences(loop_id):
    """Reorder stop sequences in a loop"""
    data = request.json
    
    if not data or 'stop_sequence_ids' not in data:
        return jsonify({"error": "No stop_sequence_ids provided"}), 400
    
    result = loop_service.reorder_stop_sequences(loop_id, data['stop_sequence_ids'])
    
    if not result:
        return jsonify({"error": "Loop not found"}), 404
    
    return jsonify({
        "status": "success",
        "loop": result["loop"].to_dict()
    })