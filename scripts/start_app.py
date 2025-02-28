#!/usr/bin/env python
import os
import sys
import subprocess
import webbrowser
import time
import signal
import threading
import json

def find_backend_dir():
    """Find the backend directory based on script location"""
    # If running from source
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    
    backend_dir = os.path.join(parent_dir, 'backend')
    if os.path.exists(backend_dir):
        return backend_dir
    
    # If running from dist
    backend_dir = os.path.join(script_dir, 'backend')
    if os.path.exists(backend_dir):
        return backend_dir
    
    # If backend is in current directory
    if os.path.exists('app.py'):
        return os.getcwd()
    
    print("Error: Cannot find backend directory")
    sys.exit(1)

def setup_environment():
    """Set up environment variables for API keys"""
    backend_dir = find_backend_dir()
    api_keys_file = os.path.join(backend_dir, 'data', 'api_keys.json')
    
    if os.path.exists(api_keys_file):
        try:
            with open(api_keys_file, 'r') as f:
                api_keys = json.load(f)
                for key, value in api_keys.items():
                    if value and key not in os.environ:
                        os.environ[key] = value
                        print(f"Loaded {key} from saved configuration")
        except Exception as e:
            print(f"Warning: Failed to load API keys: {e}")

def run_backend():
    """Run the Flask backend"""
    backend_dir = find_backend_dir()
    print(f"Starting backend from {backend_dir}")
    
    # Add backend directory to Python path
    sys.path.insert(0, backend_dir)
    os.chdir(backend_dir)
    
    # Set up environment
    setup_environment()
    
    # Import and run the Flask app
    try:
        from ..backend.app import create_app
        
        app = create_app()
        app.run(host='127.0.0.1', port=5000, debug=False)
    except ImportError as e:
        print(f"Error importing Flask app: {e}")
        print("Make sure all dependencies are installed:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting backend: {e}")
        sys.exit(1)

def main():
    """Main entry point"""
    # Check python version
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Wait for the backend to start
    print("Starting AI Chat App...")
    time.sleep(2)
    
    # Open browser to the app
    webbrowser.open('http://localhost:5000')
    
    print("AI Chat App is running. Press Ctrl+C to exit.")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")
        sys.exit(0)

if __name__ == "__main__":
    main()