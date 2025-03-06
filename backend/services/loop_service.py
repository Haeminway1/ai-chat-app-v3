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
        """Start a loop with an initial prompt - improved initialization"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop or not loop.participants:
            logger.warning(f"Cannot start loop {loop_id}: Loop not found or has no participants")
            return None
        
        # Check if already running
        if loop_id in self.active_loops and loop.status == "running":
            logger.info(f"Loop {loop_id} is already running")
            return loop
        
        # Always reset messages when starting a new loop conversation
        loop.messages = []
        loop.current_turn = 0
        
        # Add initial user message - this will be the seed for the conversation
        # The frontend will hide this message in the UI
        user_message = loop.add_message(initial_prompt, "user")
        logger.info(f"Added initial user message: {user_message.id}")
        
        # Set loop status to running
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
        
        logger.info(f"Started loop {loop_id} with {len(loop.participants)} participants")
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
        """Stop a running loop without clearing initial prompt"""
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
        """Reset a loop to its initial state but preserve the loop configuration"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        # Stop the loop if it's running
        if loop.status in ["running", "paused"]:
            self.stop_loop(loop_id)
        
        # Clear messages but don't reset anything else
        loop.messages = []
        loop.current_turn = 0
        loop.status = "stopped"
        loop.updated_at = datetime.now()
        
        return self.loop_store.save_loop(loop)
        
    def _run_loop_thread(self, loop_id, stop_event):
        """Background thread to process loop turns with improved flow management"""
        try:
            # Initialize model manager
            self.model_manager._initialize_models()
            
            # Keep track of cycle count for monitoring
            cycle_count = 0
            
            while not stop_event.is_set():
                # Get the latest loop state
                loop = self.loop_store.get_loop(loop_id)
                
                # Exit if loop is no longer running
                if not loop or loop.status != "running":
                    logger.info(f"Loop {loop_id} is no longer running. Status: {loop.status if loop else 'None'}")
                    break
                
                # Check if we've hit the max turns limit
                if loop.max_turns and loop.current_turn >= loop.max_turns:
                    logger.info(f"Loop {loop_id} reached max turns: {loop.max_turns}")
                    loop.status = "stopped"
                    self.loop_store.save_loop(loop)
                    break
                
                # Get the last message and sender
                last_message = loop.messages[-1] if loop.messages else None
                
                if not last_message:
                    logger.warning(f"Loop {loop_id} has no messages to process")
                    break
                
                # If the last message is a thinking message, skip this iteration
                # This prevents processing a message that's still in thinking state
                if last_message.content == "Thinking...":
                    logger.info(f"Loop {loop_id} has a thinking message as the last message. Waiting...")
                    time.sleep(1)
                    continue
                
                # Determine the next participant
                next_participant = loop.get_next_participant(last_message.sender)
                
                if not next_participant:
                    logger.warning(f"Loop {loop_id} has no next participant after {last_message.sender}")
                    break
                
                # Log progress to help with debugging
                cycle_count += 1
                logger.info(f"Loop {loop_id} - Cycle {cycle_count}")
                logger.info(f"Last message from: {last_message.sender}, Next participant: {next_participant.display_name}")
                
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
                    
                    # Check if response is empty or invalid
                    if not response or not response.strip():
                        error_msg = "Error: Model returned empty response"
                        logger.error(error_msg)
                        
                        # Update the thinking message with error
                        loop = self.loop_store.get_loop(loop_id)
                        for i, msg in enumerate(loop.messages):
                            if msg.id == thinking_message.id:
                                loop.messages[i].content = error_msg
                                break
                        
                        loop.status = "paused"
                        self.loop_store.save_loop(loop)
                        break
                    
                    # Get fresh loop state after processing
                    loop = self.loop_store.get_loop(loop_id)
                    
                    # Find and update the thinking message
                    found_thinking = False
                    for i, msg in enumerate(loop.messages):
                        if msg.id == thinking_message.id:
                            loop.messages[i].content = response
                            found_thinking = True
                            break
                    
                    if not found_thinking:
                        logger.warning(f"Could not find thinking message {thinking_message.id} to update")
                    
                    # Save the updated loop
                    self.loop_store.save_loop(loop)
                    
                    # Add a small delay between messages to prevent API rate limits
                    # and to make the conversation look more natural
                    time.sleep(2)
                    
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
            
            logger.info(f"Loop thread for {loop_id} has exited")
    
    def _process_with_model(self, loop_id, participant, content):
        """Process a message with an AI model - final version with identity preservation"""
        # Get the model configuration
        model_type = participant.model
        current_participant_name = participant.display_name
        current_participant_id = participant.id
        
        # Create a dedicated ModelManager instance for this request
        participant_model_manager = ModelManager()
        participant_model_manager._initialize_models()
        participant_model_manager.change_model(model_type)
        
        # Get model config for system prompt support check
        model_config = participant_model_manager.get_model_config(model_type)
        supports_system = model_config.get('supports_system_prompt', True)
        
        # Get the full loop data to access all messages
        loop = self.loop_store.get_loop(loop_id)
        
        # Create mapping of participant IDs to their names
        participant_names = {}
        for p in loop.participants:
            participant_names[p.id] = p.display_name
        
        # Keep user's original system prompt 
        original_system_prompt = participant.system_prompt or ""
        
        # Create identity context without modifying the original system prompt
        identity_marker = f"You are responding as {current_participant_name}."
        identity_context = f"""
    CONVERSATION PARTICIPANTS:
    - You are {current_participant_name}
    """
        
        # Add other participants to identity context
        for p in loop.participants:
            if p.id != participant.id:
                identity_context += f"- {participant_names[p.id]}\n"
        
        # Combine prompts (original prompt first, then identity info)
        enhanced_system_prompt = original_system_prompt
        if original_system_prompt:
            enhanced_system_prompt += "\n\n"
        enhanced_system_prompt += identity_context
        
        # Process based on system prompt support
        if supports_system:
            # Create a conversation history with proper roles
            messages = [{"role": "system", "content": enhanced_system_prompt}]
            
            # Extract relevant conversation messages (last 20 to avoid token limits)
            conversation_messages = []
            relevant_messages = loop.messages[-20:] if len(loop.messages) > 20 else loop.messages
            
            for message in relevant_messages:
                # Skip thinking messages and system messages
                if message.content == "Thinking..." or message.sender == "system":
                    continue
                
                if message.sender == "user":
                    # User messages remain as user
                    conversation_messages.append({
                        "role": "user", 
                        "content": message.content
                    })
                else:
                    # Handle AI messages with perspective shifts
                    speaker_name = participant_names.get(message.sender, "Unknown AI")
                    
                    if message.sender == current_participant_id:
                        # This is from the current participant - use assistant role
                        conversation_messages.append({
                            "role": "assistant",
                            "content": message.content
                        })
                    else:
                        # This is from another AI - use user role with clear attribution
                        conversation_messages.append({
                            "role": "user",
                            "content": f"{speaker_name}: {message.content}"
                        })
            
            # Add all conversation messages
            messages.extend(conversation_messages)
            
            # Log details for debugging
            logger.info(f"Processing with {model_type} for {current_participant_name} (ID: {current_participant_id})")
            logger.info(f"Total messages in context: {len(messages)}")
            
            # Generate response
            response = participant_model_manager.generate_content(messages)
            
            # Check if response is prefixed with the participant's name and remove if needed
            if response.startswith(f"{current_participant_name}:"):
                response = response[len(f"{current_participant_name}:"):].strip()
            
            return response
        else:
            # For models without system message support, use plaintext format
            conversation_transcript = ""
            if original_system_prompt:
                conversation_transcript += original_system_prompt + "\n\n"
            
            conversation_transcript += identity_context + "\n\n"
            conversation_transcript += "CONVERSATION HISTORY:\n"
            
            # Add each message with identity perspective
            relevant_messages = loop.messages[-20:] if len(loop.messages) > 20 else loop.messages
            
            for message in relevant_messages:
                if message.content == "Thinking..." or message.sender == "system":
                    continue
                    
                if message.sender == "user":
                    conversation_transcript += f"User: {message.content}\n"
                else:
                    speaker_name = participant_names.get(message.sender, "Unknown AI")
                    
                    if message.sender == current_participant_id:
                        conversation_transcript += f"You ({current_participant_name}): {message.content}\n"
                    else:
                        conversation_transcript += f"{speaker_name}: {message.content}\n"
            
            # Add prompt for continuation
            conversation_transcript += f"\nYour response as {current_participant_name}: "
            
            # Generate response
            response = participant_model_manager.generate_content(conversation_transcript)
            return response