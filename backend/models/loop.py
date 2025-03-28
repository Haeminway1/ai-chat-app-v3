import json
import os
import uuid
from datetime import datetime

class Participant:
    def __init__(self, model, order_index, system_prompt="", display_name=None, user_prompt="", temperature=0.7, max_tokens=4000):
        self.id = str(uuid.uuid4())
        self.model = model
        self.order_index = order_index
        self.system_prompt = system_prompt
        self.user_prompt = user_prompt
        self.display_name = display_name or f"AI {order_index}"
        self.temperature = temperature
        self.max_tokens = max_tokens
    
    def to_dict(self):
        return {
            "id": self.id,
            "model": self.model,
            "order_index": self.order_index,
            "system_prompt": self.system_prompt,
            "user_prompt": self.user_prompt,
            "display_name": self.display_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }
    
    @classmethod
    def from_dict(cls, data):
        participant = cls(
            data["model"], 
            data["order_index"], 
            data.get("system_prompt", ""),
            data.get("display_name"),
            data.get("user_prompt", ""),
            data.get("temperature", 0.7),
            data.get("max_tokens", 4000)
        )
        participant.id = data.get("id", str(uuid.uuid4()))
        return participant

class StopSequence:
    def __init__(self, model, order_index, system_prompt="", display_name=None, stop_condition=""):
        self.id = str(uuid.uuid4())
        self.model = model
        self.order_index = order_index
        self.system_prompt = system_prompt
        self.stop_condition = stop_condition
        self.display_name = display_name or f"Stop Sequence {order_index}"
        self.type = "stop_sequence"
    
    def to_dict(self):
        return {
            "id": self.id,
            "model": self.model,
            "order_index": self.order_index,
            "system_prompt": self.system_prompt,
            "stop_condition": self.stop_condition,
            "display_name": self.display_name,
            "type": "stop_sequence"
        }
    
    @classmethod
    def from_dict(cls, data):
        stop_seq = cls(
            data["model"], 
            data["order_index"], 
            data.get("system_prompt", ""),
            data.get("display_name"),
            data.get("stop_condition", "")
        )
        stop_seq.id = data.get("id", str(uuid.uuid4()))
        return stop_seq

class Message:
    def __init__(self, content, sender, timestamp=None):
        self.id = str(uuid.uuid4())
        self.content = content
        self.sender = sender  # participant_id or "user"
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self):
        return {
            "id": self.id,
            "content": self.content,
            "sender": self.sender,
            "timestamp": self.timestamp.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data):
        msg = cls(data["content"], data["sender"])
        msg.id = data.get("id", str(uuid.uuid4()))
        msg.timestamp = datetime.fromisoformat(data["timestamp"]) if "timestamp" in data else datetime.now()
        return msg

class Loop:
    def __init__(self, title=None):
        self.id = str(uuid.uuid4())
        self.title = title or "New Loop"
        self.participants = []
        self.stop_sequences = []
        self.messages = []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.status = "stopped"  # "running", "paused", "stopped"
        self.max_turns = None  # Optional limit, null means unlimited
        self.current_turn = 0
        self.loop_user_prompt = ""  # New field for loop user prompt that receives the last participant's output
    
    def add_participant(self, model, order_index, system_prompt="", display_name=None, user_prompt="", temperature=0.7, max_tokens=4000):
        participant = Participant(model, order_index, system_prompt, display_name, user_prompt, temperature, max_tokens)
        self.participants.append(participant)
        self.updated_at = datetime.now()
        return participant
    
    def add_stop_sequence(self, model, order_index, system_prompt="", display_name=None, stop_condition=""):
        stop_seq = StopSequence(model, order_index, system_prompt, display_name, stop_condition)
        self.stop_sequences.append(stop_seq)
        self.updated_at = datetime.now()
        return stop_seq
    
    def remove_participant(self, participant_id):
        self.participants = [p for p in self.participants if p.id != participant_id]
        self.updated_at = datetime.now()
    
    def remove_stop_sequence(self, stop_sequence_id):
        self.stop_sequences = [s for s in self.stop_sequences if s.id != stop_sequence_id]
        self.updated_at = datetime.now()
    
    def get_participant(self, participant_id):
        for participant in self.participants:
            if participant.id == participant_id:
                return participant
        return None
    
    def get_stop_sequence(self, stop_sequence_id):
        for stop_seq in self.stop_sequences:
            if stop_seq.id == stop_sequence_id:
                return stop_seq
        return None
    
    def update_participant(self, participant_id, **kwargs):
        for participant in self.participants:
            if participant.id == participant_id:
                for key, value in kwargs.items():
                    if hasattr(participant, key):
                        setattr(participant, key, value)
                self.updated_at = datetime.now()
                return participant
        return None
    
    def update_stop_sequence(self, stop_sequence_id, **kwargs):
        for stop_seq in self.stop_sequences:
            if stop_seq.id == stop_sequence_id:
                for key, value in kwargs.items():
                    if hasattr(stop_seq, key):
                        setattr(stop_seq, key, value)
                self.updated_at = datetime.now()
                return stop_seq
        return None
    
    def reorder_participants(self, new_order):
        """Update order_index for participants based on a list of participant IDs"""
        # Create a mapping of participant ID to participant object
        participant_map = {p.id: p for p in self.participants}
        
        # Update order_index based on the new order
        for index, participant_id in enumerate(new_order):
            if participant_id in participant_map:
                participant_map[participant_id].order_index = index + 1
        
        # Sort participants by order_index
        self.participants.sort(key=lambda p: p.order_index)
        self.updated_at = datetime.now()
    
    def reorder_stop_sequences(self, new_order):
        """Update order_index for stop sequences based on a list of stop sequence IDs"""
        # Create a mapping of stop sequence ID to stop sequence object
        stop_seq_map = {s.id: s for s in self.stop_sequences}
        
        # Update order_index based on the new order
        for index, stop_seq_id in enumerate(new_order):
            if stop_seq_id in stop_seq_map:
                stop_seq_map[stop_seq_id].order_index = index + 1
        
        # Sort stop sequences by order_index
        self.stop_sequences.sort(key=lambda s: s.order_index)
        self.updated_at = datetime.now()
    
    def add_message(self, content, sender):
        message = Message(content, sender)
        self.messages.append(message)
        self.updated_at = datetime.now()
        self.current_turn += 1
        return message
    
    def get_sorted_participants(self):
        """Get participants sorted by order_index"""
        return sorted(self.participants, key=lambda p: p.order_index)
    
    def get_sorted_stop_sequences(self):
        """Get stop sequences sorted by order_index"""
        return sorted(self.stop_sequences, key=lambda s: s.order_index)
    
    def get_next_participant(self, current_participant_id=None):
        """Get the next participant in the loop sequence"""
        sorted_participants = self.get_sorted_participants()
        
        if not sorted_participants:
            return None
        
        # If no current participant or it's the user's first message
        if current_participant_id is None or current_participant_id == "user":
            return sorted_participants[0]
        
        # Find current participant index
        current_index = -1
        for i, p in enumerate(sorted_participants):
            if p.id == current_participant_id:
                current_index = i
                break
        
        if current_index == -1:
            # Current participant not found, start from beginning
            return sorted_participants[0]
        
        # Get next participant (wrap around if at the end)
        next_index = (current_index + 1) % len(sorted_participants)
        return sorted_participants[next_index]
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "participants": [p.to_dict() for p in self.participants],
            "stop_sequences": [s.to_dict() for s in self.stop_sequences],
            "messages": [msg.to_dict() for msg in self.messages],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "status": self.status,
            "max_turns": self.max_turns,
            "current_turn": self.current_turn,
            "loop_user_prompt": self.loop_user_prompt
        }
    
    @classmethod
    def from_dict(cls, data):
        loop = cls(data.get("title"))
        loop.id = data.get("id", str(uuid.uuid4()))
        loop.participants = [Participant.from_dict(p_data) for p_data in data.get("participants", [])]
        loop.stop_sequences = [StopSequence.from_dict(s_data) for s_data in data.get("stop_sequences", [])] if "stop_sequences" in data else []
        loop.messages = [Message.from_dict(msg_data) for msg_data in data.get("messages", [])]
        loop.created_at = datetime.fromisoformat(data["created_at"]) if "created_at" in data else datetime.now()
        loop.updated_at = datetime.fromisoformat(data["updated_at"]) if "updated_at" in data else datetime.now()
        loop.status = data.get("status", "stopped")
        loop.max_turns = data.get("max_turns")
        loop.current_turn = data.get("current_turn", 0)
        loop.loop_user_prompt = data.get("loop_user_prompt", "")
        return loop

class LoopStore:
    """File-based storage for loops"""
    
    def __init__(self, storage_dir="./data/loops"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
    
    def save_loop(self, loop):
        """Save a loop to file"""
        file_path = os.path.join(self.storage_dir, f"{loop.id}.json")
        with open(file_path, 'w') as f:
            json.dump(loop.to_dict(), f, indent=2)
        return loop
    
    def get_loop(self, loop_id):
        """Get a loop by ID"""
        file_path = os.path.join(self.storage_dir, f"{loop_id}.json")
        if not os.path.exists(file_path):
            return None
        
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        return Loop.from_dict(data)
    
    def list_loops(self):
        """List all loops"""
        loops = []
        for filename in os.listdir(self.storage_dir):
            if filename.endswith(".json"):
                loop_id = filename[:-5]  # Remove '.json'
                loop = self.get_loop(loop_id)
                if loop:
                    loops.append(loop)
        
        # Sort by updated_at (newest first)
        loops.sort(key=lambda c: c.updated_at, reverse=True)
        return loops
    
    def delete_loop(self, loop_id):
        """Delete a loop by ID"""
        file_path = os.path.join(self.storage_dir, f"{loop_id}.json")
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False