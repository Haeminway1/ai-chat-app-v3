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
    
    def add_participant(self, loop_id, model, system_prompt="", display_name=None, user_prompt=""):
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
        logger.info(f"User prompt: {user_prompt}")
        logger.info(f"Display name: {display_name or f'AI {next_order}'}")
        
        participant = loop.add_participant(model, next_order, system_prompt, display_name, user_prompt)
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
    
    def update_loop_prompt(self, loop_id, loop_user_prompt):
        """Update the loop user prompt"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        loop.loop_user_prompt = loop_user_prompt
        loop.updated_at = datetime.now()
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
                    logger.info(f"Loop {loop_id} is no longer running, exiting thread.")
                    break
                
                # Get messages and participants
                messages = loop.messages
                participants = loop.get_sorted_participants()
                stop_sequences = loop.get_sorted_stop_sequences()
                
                if not messages or not participants:
                    logger.warning(f"Loop {loop_id} has no messages or participants, pausing.")
                    time.sleep(1)
                    continue
                
                # Determine the last sender
                last_message = messages[-1]
                last_sender = last_message.sender
                
                # Check if we should stop based on stop sequences after each new AI message (not user input)
                if stop_sequences and last_sender != "user" and len(messages) >= 2:
                    for stop_seq in stop_sequences:
                        # No longer check only for preceding participant - evaluate against entire conversation
                        # Process the stop condition with the AI model
                        stop_reason = self._check_stop_condition(
                            loop_id, 
                            stop_seq, 
                            messages
                        )
                        
                        # If the stop condition is met, stop the loop
                        if stop_reason:
                            logger.info(f"Stop condition met for loop {loop_id}, stopping: {stop_reason}")
                            loop.status = "stopped"
                            self.loop_store.save_loop(loop)
                            
                            # Add a system message indicating the loop was stopped
                            loop.add_message(
                                f"Loop stopped by stop sequence '{stop_seq.display_name}': {stop_reason}",
                                "system"
                            )
                            self.loop_store.save_loop(loop)
                            return
                
                # Get next participant
                next_participant = loop.get_next_participant(last_sender)
                
                if not next_participant:
                    logger.warning(f"Could not determine next participant for loop {loop_id}, pausing.")
                    time.sleep(1)
                    continue
                
                # Get content to send to the model (this is where we'll implement the new user_prompt logic)
                processed_input = ""
                
                # If the last message was from a user or another participant
                if last_sender == "user" or last_sender in [p.id for p in participants]:
                    # Determine the content based on who sent the last message
                    if last_sender == "user":
                        # This is the initial user message at the start of the loop
                        processed_input = last_message.content
                    else:
                        # Find the last participant
                        last_participant = None
                        for p in participants:
                            if p.id == last_sender:
                                last_participant = p
                                break
                        
                        # Determine the current participant in the sequence
                        current_index = participants.index(next_participant)
                        
                        # If this is not the first participant, use user_prompt with the last message
                        if current_index > 0 or (current_index == 0 and cycle_count > 0):
                            # If it's the first participant on subsequent cycles, use loop_user_prompt
                            if current_index == 0 and cycle_count > 0:
                                if loop.loop_user_prompt:
                                    # Replace {prior_output} in the loop user prompt
                                    processed_input = loop.loop_user_prompt.replace("{prior_output}", last_message.content)
                                    # If no placeholder was found, append to the end
                                    if "{prior_output}" not in loop.loop_user_prompt:
                                        processed_input = f"{loop.loop_user_prompt}\n\n{last_message.content}"
                                else:
                                    # Default if no loop user prompt is specified
                                    processed_input = f"Input:\n{last_message.content}"
                            else:
                                # Not the first participant, use its custom user prompt
                                if next_participant.user_prompt:
                                    # Replace {prior_output} in the user prompt
                                    processed_input = next_participant.user_prompt.replace("{prior_output}", last_message.content)
                                    # If no placeholder was found, append to the end
                                    if "{prior_output}" not in next_participant.user_prompt:
                                        processed_input = f"{next_participant.user_prompt}\n\n{last_message.content}"
                                else:
                                    # Default if no user prompt is specified
                                    processed_input = f"Input:\n{last_message.content}"
                        else:
                            # First participant in the first cycle - use initial message directly
                            processed_input = last_message.content
                    
                    logger.info(f"Processing turn for participant {next_participant.display_name} in loop {loop_id}")
                    
                    try:
                        # Call the model with the processed input
                        response_content = self._process_with_model(loop_id, next_participant, processed_input)
                        
                        if response_content and not stop_event.is_set():
                            # Add AI message to conversation
                            loop.add_message(response_content, next_participant.id)
                            self.loop_store.save_loop(loop)
                            
                            logger.info(f"Added response from {next_participant.display_name} to loop {loop_id}")
                            
                            # First turn completed for all participants; increment cycle
                            if next_participant.order_index == max(p.order_index for p in participants):
                                cycle_count += 1
                                logger.info(f"Completed cycle {cycle_count} for loop {loop_id}")
                        
                        # Brief pause between turns to avoid overwhelming the API
                        time.sleep(0.5)
                    
                    except Exception as e:
                        logger.error(f"Error processing turn for participant {next_participant.display_name}: {e}")
                        logger.error(traceback.format_exc())
                        # Longer pause after an error
                        time.sleep(2)
                
                # Short pause between loop iterations
                time.sleep(0.2)
        
        except Exception as e:
            logger.error(f"Error in loop thread for loop {loop_id}: {e}")
            logger.error(traceback.format_exc())
        finally:
            logger.info(f"Loop thread for loop {loop_id} terminated")
    
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

    def add_stop_sequence(self, loop_id, model, system_prompt="", display_name=None, stop_condition=""):
        """Add a stop sequence to a loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        # Get the highest order_index or 0 if no stop sequences
        order_index = 1
        if loop.stop_sequences:
            order_index = max(s.order_index for s in loop.stop_sequences) + 1
        
        # If no display name, create a default one
        if not display_name:
            display_name = f"Stop Sequence {order_index}"
        
        # Add the stop sequence
        loop.add_stop_sequence(model, order_index, system_prompt, display_name, stop_condition)
        return {
            "loop": self.loop_store.save_loop(loop),
            "success": True
        }
    
    def update_stop_sequence(self, loop_id, stop_sequence_id, updates):
        """Update a stop sequence in a loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        stop_sequence = loop.update_stop_sequence(stop_sequence_id, **updates)
        if not stop_sequence:
            return None
            
        return {
            "loop": self.loop_store.save_loop(loop),
            "success": True
        }
    
    def remove_stop_sequence(self, loop_id, stop_sequence_id):
        """Remove a stop sequence from a loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        loop.remove_stop_sequence(stop_sequence_id)
        return {
            "loop": self.loop_store.save_loop(loop),
            "success": True
        }
    
    def reorder_stop_sequences(self, loop_id, stop_sequence_ids):
        """Reorder stop sequences in a loop"""
        loop = self.loop_store.get_loop(loop_id)
        if not loop:
            return None
        
        loop.reorder_stop_sequences(stop_sequence_ids)
        return {
            "loop": self.loop_store.save_loop(loop),
            "success": True
        }

    def _check_stop_condition(self, loop_id, stop_sequence, messages):
        """Check if a stop condition is met using the entire conversation history"""
        # Get the full loop to access all messages
        loop = self.loop_store.get_loop(loop_id)
        
        # Create a readable conversation history
        conversation_history = ""
        participant_names = {}
        
        # Create mapping of participant IDs to their names
        for p in loop.participants:
            participant_names[p.id] = p.display_name
        
        # Format the conversation history
        for msg in messages:
            if msg.sender == "user":
                conversation_history += f"User: {msg.content}\n\n"
            elif msg.sender == "system":
                conversation_history += f"System: {msg.content}\n\n"
            else:
                sender_name = participant_names.get(msg.sender, "Unknown AI")
                conversation_history += f"{sender_name}: {msg.content}\n\n"
        
        # Extract the last message for simple string matching
        last_message_content = messages[-1].content if messages else ""
        
        # If there's a simple stop condition string, just check for exact match in the last message
        if stop_sequence.stop_condition and not stop_sequence.system_prompt:
            if stop_sequence.stop_condition.strip() in last_message_content:
                return stop_sequence.stop_condition
            return False
        
        # If there's a system prompt, use the AI to evaluate the entire conversation
        if stop_sequence.system_prompt:
            try:
                # Create prompt for checking the stop condition
                prompt = f"""
                You are a stop condition evaluator. Your task is to determine if the loop should be stopped based on the given criteria.
                
                STOP CONDITION:
                {stop_sequence.stop_condition}
                
                CONVERSATION HISTORY:
                {conversation_history}
                
                INSTRUCTIONS:
                1. Evaluate if the conversation meets the stop condition criteria.
                2. Consider the entire conversation flow and context, not just the last message.
                3. Return exactly "STOP" if the condition is met, or "CONTINUE" if not.
                4. Be precise in your evaluation and follow the stop condition exactly.
                
                Your response (STOP or CONTINUE):
                """
                
                # Process with the model
                model_type = stop_sequence.model
                
                # Create a dedicated ModelManager instance
                stop_model_manager = ModelManager()
                stop_model_manager._initialize_models()
                stop_model_manager.change_model(model_type)
                
                messages = [
                    {"role": "system", "content": stop_sequence.system_prompt},
                    {"role": "user", "content": prompt}
                ]
                
                response = stop_model_manager.generate_content(messages)
                
                # Check if the response contains STOP
                if "STOP" in response.upper():
                    reason = response.replace("STOP", "").strip()
                    return reason if reason else "Stop condition met"
                
                return False
            
            except Exception as e:
                logger.error(f"Error evaluating stop condition: {e}")
                return False
        
        return False