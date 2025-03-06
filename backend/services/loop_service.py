import uuid
import logging
import threading
import time
import traceback
from datetime import datetime
from models.loop import Loop, LoopStore
from ai_toolkit.model_manager import ModelManager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LoopService:
    def __init__(self):
        self.loop_store = LoopStore()
        self.model_manager = ModelManager()
        self.active_loops = {}  # Track running loops and their threads
        self.stop_events = {}  # Track stop events for threads
    
    def create_loop(self, title=None):
        """Create a new loop"""
        loop = Loop(title)
        return self.loop_store.save_loop(loop)
    
    def list_loops(self):
        """List all loops"""
        return self.loop_store.list_loops()
    
    def get_loop(self, loop_id):
        """Get a specific loop"""
        return self.loop_store.get_loop(loop_id)
    
    def update_loop_title(self, loop_id, title):
        """Update the title of a loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        loop.title = title
        loop.updated_at = datetime.now()
        return self.loop_store.save_loop(loop)
    
    def delete_loop(self, loop_id):
        """Delete a loop"""
        # Stop the loop if it's running
        self.stop_loop(loop_id)
        return self.loop_store.delete_loop(loop_id)
    
    def add_participant(self, loop_id, model, system_prompt="", display_name=None):
        """Add a participant to the loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        # Determine the next order index
        next_order = 1
        if loop.participants:
            next_order = max(p.order_index for p in loop.participants) + 1
        
        # Log system prompt info for debugging
        logger.info(f"Adding participant to loop {loop_id} with model {model}")
        logger.info(f"System prompt: {system_prompt}")
        logger.info(f"Display name: {display_name or f'AI {next_order}'}")
        
        participant = loop.add_participant(model, next_order, system_prompt, display_name)
        return self.loop_store.save_loop(loop), participant
    
    def update_participant(self, loop_id, participant_id, updates):
        """Update a participant's properties"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        # Log update info for debugging
        logger.info(f"Updating participant {participant_id} in loop {loop_id}")
        logger.info(f"Updates: {updates}")
        
        updated_participant = loop.update_participant(participant_id, **updates)
        if updated_participant:
            # Log the updated participant's information
            logger.info(f"Updated participant: {updated_participant.to_dict()}")
            return self.loop_store.save_loop(loop), updated_participant
        return None
    
    def remove_participant(self, loop_id, participant_id):
        """Remove a participant from the loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        loop.remove_participant(participant_id)
        return self.loop_store.save_loop(loop)
    
    def reorder_participants(self, loop_id, participant_ids):
        """Reorder participants in the loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        loop.reorder_participants(participant_ids)
        return self.loop_store.save_loop(loop)
    
    def start_loop(self, loop_id, initial_prompt):
        """Start a loop with an initial prompt"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop or not loop.participants:
            return None
        
        # Check if already running
        if loop_id in self.active_loops:
            return loop
        
        # Add initial user message
        loop.add_message(initial_prompt, "user")
        loop.status = "running"
        self.loop_store.save_loop(loop)
        
        # Create a stop event for this loop
        self.stop_events[loop_id] = threading.Event()
        
        # Start loop thread
        loop_thread = threading.Thread(
            target=self._run_loop_thread,
            args=(loop_id, self.stop_events[loop_id]),
            daemon=True
        )
        self.active_loops[loop_id] = loop_thread
        loop_thread.start()
        
        return loop
    
    def pause_loop(self, loop_id):
        """Pause a running loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        if loop.status == "running":
            loop.status = "paused"
            self.loop_store.save_loop(loop)
            
            # Set stop event to pause the thread
            if loop_id in self.stop_events:
                self.stop_events[loop_id].set()
                
            # Clean up
            if loop_id in self.active_loops:
                thread = self.active_loops.pop(loop_id)
                if thread.is_alive():
                    thread.join(timeout=1)
                
            if loop_id in self.stop_events:
                del self.stop_events[loop_id]
        
        return loop
    
    def resume_loop(self, loop_id):
        """Resume a paused loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        if loop.status == "paused":
            loop.status = "running"
            self.loop_store.save_loop(loop)
            
            # Create a new stop event
            self.stop_events[loop_id] = threading.Event()
            
            # Start a new thread
            loop_thread = threading.Thread(
                target=self._run_loop_thread,
                args=(loop_id, self.stop_events[loop_id]),
                daemon=True
            )
            self.active_loops[loop_id] = loop_thread
            loop_thread.start()
        
        return loop
    
    def stop_loop(self, loop_id):
        """Stop a running loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        if loop.status in ["running", "paused"]:
            loop.status = "stopped"
            self.loop_store.save_loop(loop)
            
            # Set stop event to terminate the thread
            if loop_id in self.stop_events:
                self.stop_events[loop_id].set()
                
            # Clean up
            if loop_id in self.active_loops:
                thread = self.active_loops.pop(loop_id)
                if thread.is_alive():
                    thread.join(timeout=1)
                
            if loop_id in self.stop_events:
                del self.stop_events[loop_id]
        
        return loop
    
    def reset_loop(self, loop_id):
        """Reset a loop to its initial state"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        # Stop the loop if it's running
        if loop.status in ["running", "paused"]:
            self.stop_loop(loop_id)
        
        # Clear all messages
        loop.messages = []
        loop.current_turn = 0
        loop.status = "stopped"
        loop.updated_at = datetime.now()
        
        return self.loop_store.save_loop(loop)
    
    def _run_loop_thread(self, loop_id, stop_event):
        """Background thread to process loop turns"""
        try:
            # Initialize model manager
            self.model_manager._initialize_models()
            
            while not stop_event.is_set():
                # Get the latest loop state
                loop = self.loop_store.get_loop(loop_id)
                
                # Exit if loop is no longer running
                if not loop or loop.status != "running":
                    break
                
                # Check if we've hit the max turns limit
                if loop.max_turns and loop.current_turn >= loop.max_turns:
                    loop.status = "stopped"
                    self.loop_store.save_loop(loop)
                    break
                
                # Get the last message and sender
                last_message = loop.messages[-1] if loop.messages else None
                
                if not last_message:
                    # No messages to process
                    break
                
                # Determine the next participant
                next_participant = loop.get_next_participant(last_message.sender)
                
                if not next_participant:
                    # No participants to process the message
                    break
                
                # Add a "thinking" message to show real-time updates
                thinking_message = loop.add_message(f"Thinking...", next_participant.id)
                self.loop_store.save_loop(loop)
                
                # Process the message with the next participant's model
                try:
                    response = self._process_with_model(
                        loop_id,
                        next_participant,
                        last_message.content
                    )
                    
                    # Get fresh loop state after processing
                    loop = self.loop_store.get_loop(loop_id)
                    
                    # Find and update the thinking message
                    for i, msg in enumerate(loop.messages):
                        if msg.id == thinking_message.id:
                            loop.messages[i].content = response
                            break
                    
                    # Save the updated loop
                    self.loop_store.save_loop(loop)
                    
                    # Add a small delay to prevent hammering the API
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Error processing loop turn: {str(e)}")
                    traceback.print_exc()
                    
                    # Add error message
                    error_msg = f"Error: {str(e)}"
                    
                    # Get fresh loop state
                    loop = self.loop_store.get_loop(loop_id)
                    
                    # Find and update the thinking message with error
                    for i, msg in enumerate(loop.messages):
                        if msg.id == thinking_message.id:
                            loop.messages[i].content = error_msg
                            break
                    
                    loop.status = "paused"  # Pause on error
                    self.loop_store.save_loop(loop)
                    break
            
        except Exception as e:
            logger.error(f"Loop thread error: {str(e)}")
            traceback.print_exc()
        finally:
            # Clean up when thread exits
            if loop_id in self.active_loops:
                del self.active_loops[loop_id]
            
            if loop_id in self.stop_events:
                del self.stop_events[loop_id]
    
    def _process_with_model(self, loop_id, participant, content):
        """Process a message with an AI model"""
        # Get the model configuration
        model_type = participant.model
        
        # Create a new ModelManager instance for each participant to prevent context sharing
        # This ensures each participant has its own independent model context
        participant_instance_id = f"{participant.id}_{uuid.uuid4()}"
        logger.info(f"Creating new ModelManager instance {participant_instance_id} for participant {participant.id}")
        
        participant_model_manager = ModelManager()
        participant_model_manager._initialize_models()
        
        # Force change to the appropriate model
        participant_model_manager.change_model(model_type)
        
        # Create the prompt with system message if needed
        model_config = participant_model_manager.get_model_config(model_type)
        supports_system = model_config.get('supports_system_prompt', True)
        
        # Get the full loop to access all messages
        loop = self.loop_store.get_loop(loop_id)
        
        # Log the system prompt being used for debugging
        logger.info(f"Processing with model {model_type} for participant {participant.id}")
        logger.info(f"System prompt: '{participant.system_prompt}'")
        logger.info(f"Display name: '{participant.display_name}'")
        
        if supports_system and participant.system_prompt:
            # Format as a conversation with system message - use ONLY the original system prompt
            messages = [
                {"role": "system", "content": participant.system_prompt}
            ]
            
            # Get all previous messages including the current content for context
            messages_for_context = []
            for message in loop.messages:
                if message.sender == "user":
                    messages_for_context.append({"role": "user", "content": message.content})
                elif message.sender == "system":
                    continue  # Skip system error messages
                else:
                    # Get the participant info for this message
                    msg_participant = loop.get_participant(message.sender)
                    if msg_participant:
                        messages_for_context.append({"role": "assistant", "content": message.content})
                    else:
                        messages_for_context.append({"role": "assistant", "content": message.content})
            
            # Add all messages to the conversation
            messages.extend(messages_for_context)
            
            # Log the conversation being sent to the model
            logger.info(f"Sending conversation to {model_type}:")
            for idx, msg in enumerate(messages):
                logger.info(f"  {idx}. {msg['role']}: {msg['content'][:50]}...")
            
            # Generate response with full conversation context
            response = participant_model_manager.generate_content(messages)
            logger.info(f"Response from {model_type} (participant {participant.id}): {response[:100]}...")
            
            return response
        else:
            # For models without system message support, use the system prompt directly
            prompt = f"{participant.system_prompt}\n\n{content}"
            logger.info(f"Sending prompt to {model_type}: {prompt[:100]}...")
            
            response = participant_model_manager.generate_content(prompt)
            logger.info(f"Response from {model_type} (participant {participant.id}): {response[:100]}...")
            
            return response