import json
import os
import uuid
from datetime import datetime

class Message:
    def __init__(self, role, content, timestamp=None):
        self.id = str(uuid.uuid4())
        self.role = role  # 'user', 'assistant', or 'system'
        self.content = content
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data):
        msg = cls(data["role"], data["content"])
        msg.id = data.get("id", str(uuid.uuid4()))
        msg.timestamp = datetime.fromisoformat(data["timestamp"]) if "timestamp" in data else datetime.now()
        return msg

class Chat:
    def __init__(self, title=None, provider=None, model=None):
        self.id = str(uuid.uuid4())
        self.title = title or "New Chat"
        self.provider = provider
        self.model = model
        self.messages = []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.parameters = {}  # Store model parameters
    
    def add_message(self, role, content):
        message = Message(role, content)
        self.messages.append(message)
        self.updated_at = datetime.now()
        return message
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "provider": self.provider,
            "model": self.model,
            "messages": [msg.to_dict() for msg in self.messages],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "parameters": self.parameters
        }
    
    @classmethod
    def from_dict(cls, data):
        chat = cls(data.get("title"), data.get("provider"), data.get("model"))
        chat.id = data.get("id", str(uuid.uuid4()))
        chat.messages = [Message.from_dict(msg_data) for msg_data in data.get("messages", [])]
        chat.created_at = datetime.fromisoformat(data["created_at"]) if "created_at" in data else datetime.now()
        chat.updated_at = datetime.fromisoformat(data["updated_at"]) if "updated_at" in data else datetime.now()
        chat.parameters = data.get("parameters", {})
        return chat

class ChatStore:
    """File-based storage for chats"""
    
    def __init__(self, storage_dir="./data/chats"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
    
    def save_chat(self, chat):
        """Save a chat to file"""
        file_path = os.path.join(self.storage_dir, f"{chat.id}.json")
        with open(file_path, 'w') as f:
            json.dump(chat.to_dict(), f, indent=2)
        return chat
    
    def get_chat(self, chat_id):
        """Get a chat by ID"""
        file_path = os.path.join(self.storage_dir, f"{chat_id}.json")
        if not os.path.exists(file_path):
            return None
        
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        return Chat.from_dict(data)
    
    def list_chats(self):
        """List all chats"""
        chats = []
        for filename in os.listdir(self.storage_dir):
            if filename.endswith(".json"):
                chat_id = filename[:-5]  # Remove '.json'
                chat = self.get_chat(chat_id)
                if chat:
                    chats.append(chat)
        
        # Sort by updated_at (newest first)
        chats.sort(key=lambda c: c.updated_at, reverse=True)
        return chats
    
    def delete_chat(self, chat_id):
        """Delete a chat by ID"""
        file_path = os.path.join(self.storage_dir, f"{chat_id}.json")
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False