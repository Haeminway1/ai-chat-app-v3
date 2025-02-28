#!/usr/bin/env python
import os
import sys
import subprocess
import threading
import time
import json
import signal

def find_project_root():
    """Find the project root directory"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(script_dir)

def setup_environment():
    """Set up environment variables for development"""
    project_root = find_project_root()
    backend_dir = os.path.join(project_root, 'backend')
    api_keys_file = os.path.join(backend_dir, 'data', 'api_keys.json')
    
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(api_keys_file), exist_ok=True)
    
    if os.path.exists(api_keys_file):
        try:
            with open(api_keys_file, 'r') as f:
                api_keys = json.load(f)
                for key, value in api_keys.items():
                    if value:
                        os.environ[key] = value
                        print(f"Loaded {key} from saved configuration")
        except Exception as e:
            print(f"Warning: Failed to load API keys: {e}")
    
    # Set development mode
    os.environ['FLASK_ENV'] = 'development'

def run_backend():
    """Run the Flask backend in development mode"""
    project_root = find_project_root()
    backend_dir = os.path.join(project_root, 'backend')
    
    print(f"Starting backend in {backend_dir}")
    
    try:
        # Change to backend directory
        os.chdir(backend_dir)
        
        # Start Flask app with hot reloading
        subprocess.run(["python", "app.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Backend process exited with code {e.returncode}")
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Error running backend: {e}")

def run_frontend():
    """Run the React frontend in development mode"""
    project_root = find_project_root()
    frontend_dir = os.path.join(project_root, 'frontend')
    
    print(f"Starting frontend in {frontend_dir}")
    
    try:
        # Change to frontend directory
        os.chdir(frontend_dir)
        
        # Start React dev server
        if os.name == 'nt':  # Windows
            subprocess.run(["npm.cmd", "start"], check=True)
        else:  # Unix/Mac
            subprocess.run(["npm", "start"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Frontend process exited with code {e.returncode}")
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Error running frontend: {e}")

def check_dependencies():
    """Check if all dependencies are installed"""
    project_root = find_project_root()
    
    # Check Python dependencies
    backend_requirements = os.path.join(project_root, 'requirements.txt')
    if os.path.exists(backend_requirements):
        print("Checking Python dependencies...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", backend_requirements], 
                          check=True, stdout=subprocess.PIPE)
        except subprocess.CalledProcessError:
            print("Warning: Not all Python dependencies could be installed.")
            print("Please run: pip install -r requirements.txt")
    
    # Check Node.js dependencies
    frontend_dir = os.path.join(project_root, 'frontend')
    if os.path.exists(os.path.join(frontend_dir, 'package.json')):
        print("Checking Node.js dependencies...")
        try:
            os.chdir(frontend_dir)
            if os.name == 'nt':  # Windows
                subprocess.run(["npm.cmd", "install"], check=True, stdout=subprocess.PIPE)
            else:  # Unix/Mac
                subprocess.run(["npm", "install"], check=True, stdout=subprocess.PIPE)
        except subprocess.CalledProcessError:
            print("Warning: Not all Node.js dependencies could be installed.")
            print("Please run: cd frontend && npm install")
        except:
            print("Warning: npm not found. Please install Node.js.")

def main():
    """Main entry point"""
    print("Starting AI Chat App in development mode...")
    
    # Set up environment variables
    setup_environment()
    
    # Check and install dependencies
    check_dependencies()
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Wait for backend to start
    time.sleep(2)
    
    # Start frontend
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("Shutting down...")
    
    # Wait for backend thread to exit
    if backend_thread.is_alive():
        backend_thread.join(timeout=5)

if __name__ == "__main__":
    main()