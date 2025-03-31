#!/usr/bin/env python
import os
import sys
import subprocess
import webbrowser
import time
import threading
import json
import platform
import shutil
import atexit

# Get the application path
def get_app_path():
    """Get the path to the application directory"""
    if getattr(sys, 'frozen', False):
        # Running as compiled exe
        return os.path.dirname(sys.executable)
    else:
        # Running as script
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Initialize global variables
APP_PATH = get_app_path()
BACKEND_DIR = os.path.join(APP_PATH, 'backend')
FRONTEND_DIR = os.path.join(APP_PATH, 'frontend')

def find_node_executable():
    """Find Node.js installation"""
    node_cmd = "node.exe" if platform.system() == "Windows" else "node"
    
    # Direct node command search
    node_path = shutil.which(node_cmd)
    if node_path:
        return os.path.dirname(node_path)
        
    # Check common Windows Node.js installation paths
    if platform.system() == "Windows":
        possible_paths = [
            r"C:\Program Files\nodejs",
            r"C:\Program Files (x86)\nodejs",
            os.path.join(os.environ.get("APPDATA", ""), "npm")
        ]
        
        for path in possible_paths:
            node_exe = os.path.join(path, "node.exe")
            if os.path.exists(node_exe):
                return path
                
    return None

def setup_environment():
    """Set up environment variables for API keys"""
    api_keys_file = os.path.join(BACKEND_DIR, 'data', 'api_keys.json')
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(BACKEND_DIR, 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir, exist_ok=True)
    
    # Create chats directory if it doesn't exist
    chats_dir = os.path.join(data_dir, 'chats')
    if not os.path.exists(chats_dir):
        os.makedirs(chats_dir, exist_ok=True)
    
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
    print(f"Starting backend from {BACKEND_DIR}")
    
    # Change to backend directory
    os.chdir(BACKEND_DIR)
    
    # Set up environment
    setup_environment()
    
    # Run the Flask app using subprocess
    try:
        if getattr(sys, 'frozen', False):
            # Running as compiled exe - import the app
            print("Running in PyInstaller mode")
            sys.path.insert(0, BACKEND_DIR)
            from app import app
            
            # Add environment variables for configuration
            os.environ["FLASK_DEBUG"] = "0"
            os.environ["LOOP_REQUEST_TIMEOUT"] = "120"
            os.environ["LOOP_MAX_TOKENS"] = "8000"
            os.environ["LOOP_WORKER_THREADS"] = "4"
            os.environ["RESPONSE_CACHE_SIZE"] = "50"
            
            # Run in a separate thread
            from waitress import serve
            def run_waitress():
                serve(app, host='127.0.0.1', port=5000)
            
            thread = threading.Thread(target=run_waitress)
            thread.daemon = True
            thread.start()
            return thread
        else:
            # Running as script - use subprocess
            python_executable = sys.executable
            
            # Set environment variables
            env_vars = os.environ.copy()
            env_vars["FLASK_DEBUG"] = "0"
            env_vars["LOOP_REQUEST_TIMEOUT"] = "120"
            env_vars["LOOP_MAX_TOKENS"] = "8000"
            env_vars["LOOP_WORKER_THREADS"] = "4"
            env_vars["RESPONSE_CACHE_SIZE"] = "50"
            
            # Flask app run command
            backend_cmd = [python_executable, 'app.py']
            
            print(f"Running backend command: {' '.join(backend_cmd)}")
            backend_process = subprocess.Popen(
                backend_cmd,
                cwd=BACKEND_DIR,
                env=env_vars
            )
            
            return backend_process
    except Exception as e:
        print(f"Error starting backend: {e}")
        sys.exit(1)

def run_frontend():
    """Run the React frontend using npm"""
    # When running as standalone, we serve the frontend from the backend
    if getattr(sys, 'frozen', False):
        print("Using built-in frontend files")
        return None
        
    # For development, try to start the React dev server
    if os.path.exists(FRONTEND_DIR):
        print(f"Starting frontend from {FRONTEND_DIR}")
        
        # Find Node.js
        node_dir = find_node_executable()
        
        if node_dir:
            print(f"Found Node.js installation at: {node_dir}")
            
            # Set PATH environment variable
            env_vars = os.environ.copy()
            
            # Add Node.js path to PATH
            if platform.system() == "Windows":
                path_sep = ";"
                if "PATH" in env_vars:
                    env_vars["PATH"] = f"{node_dir}{path_sep}{env_vars['PATH']}"
                else:
                    env_vars["PATH"] = node_dir
            else:
                path_sep = ":"
                if "PATH" in env_vars:
                    env_vars["PATH"] = f"{node_dir}{path_sep}{env_vars['PATH']}"
                else:
                    env_vars["PATH"] = node_dir
                    
            # Set npm command
            if platform.system() == "Windows":
                npm_cmd = os.path.join(node_dir, "npm.cmd")
            else:
                npm_cmd = os.path.join(node_dir, "npm")
                
            # Check if npm exists
            if not os.path.exists(npm_cmd):
                print(f"Warning: npm not found at expected location: {npm_cmd}")
                print("Using 'npm' command from PATH")
                npm_cmd = "npm"
            
            # Prevent automatic browser opening
            env_vars['BROWSER'] = 'none'
            
            # Run npm start
            try:
                print(f"Running: {npm_cmd} start in {FRONTEND_DIR}")
                
                if platform.system() == "Windows":
                    frontend_process = subprocess.Popen(
                        [npm_cmd, "start"],
                        cwd=FRONTEND_DIR,
                        env=env_vars,
                        shell=True
                    )
                else:
                    frontend_process = subprocess.Popen(
                        [npm_cmd, "start"],
                        cwd=FRONTEND_DIR,
                        env=env_vars
                    )
                    
                return frontend_process
            except Exception as e:
                print(f"Error executing npm start: {e}")
        else:
            print("Node.js not found. Please install Node.js to run frontend.")
            
        print("\nTo start frontend manually:")
        print(f"1. Open a terminal")
        print(f"2. Navigate to: cd {FRONTEND_DIR}")
        print(f"3. Run: npm start")
    else:
        print(f"Frontend directory not found at {FRONTEND_DIR}")
    
    return None

def main():
    """Main entry point"""
    # Check Python version
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)
    
    print("\n=== AI Chat App Startup ===")
    print(f"Application path: {APP_PATH}")
    print(f"Backend directory: {BACKEND_DIR}")
    print(f"Frontend directory: {FRONTEND_DIR}")
    
    # Start backend
    backend = run_backend()
    
    # Wait for the backend to start
    print("\nStarting backend server...")
    time.sleep(3)
    
    # Start frontend if not in frozen mode
    frontend_process = None
    if not getattr(sys, 'frozen', False):
        frontend_process = run_frontend()
        if frontend_process:
            print("\nStarting frontend server...")
            print("This may take a moment...")
            time.sleep(5)
        else:
            print("\nFrontend not started automatically.")
    
    # Print access URLs
    print("\n=== Access URLs ===")
    if getattr(sys, 'frozen', False):
        # In PyInstaller mode, everything is served from backend
        print("Application URL: http://localhost:5000")
    else:
        print("Backend API URL: http://localhost:5000/api")
        print("Backend UI URL: http://localhost:5000/ui")
        if frontend_process:
            print("Frontend URL: http://localhost:3000")
    
    # Open browser
    try:
        print("\nOpening browser...")
        
        if getattr(sys, 'frozen', False):
            # In PyInstaller mode
            url = 'http://localhost:5000'
        elif frontend_process:
            # In development mode with frontend
            url = 'http://localhost:3000'
        else:
            # In development mode without frontend
            url = 'http://localhost:5000/ui'
            
        webbrowser.open(url)
            
    except Exception as e:
        print(f"Failed to open browser: {e}")
        print("Please manually open the URL in your browser.")
    
    print("\nAI Chat App is running.")
    print("Press Ctrl+C to exit.")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
            
            # Check if processes have terminated unexpectedly
            if isinstance(backend, subprocess.Popen) and backend.poll() is not None:
                print("Backend process terminated unexpectedly.")
                break
                
            if frontend_process and frontend_process.poll() is not None:
                print("Frontend process terminated unexpectedly.")
                # Continue running even if frontend fails
    
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        # Clean up processes
        if isinstance(backend, subprocess.Popen) and backend.poll() is None:
            try:
                backend.terminate()
                backend.wait(timeout=5)
            except:
                pass
                
        if frontend_process and frontend_process.poll() is None:
            try:
                frontend_process.terminate()
                frontend_process.wait(timeout=5)
            except:
                pass
                
        print("Shutdown complete.")
        sys.exit(0)

if __name__ == "__main__":
    main() 