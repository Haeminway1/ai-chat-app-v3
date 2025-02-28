import os
import subprocess
import shutil
import sys

def run_command(command, cwd=None):
    """Run a shell command and print output"""
    print(f"Running: {command}")
    process = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=cwd
    )
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        print(f"Error executing command: {command}")
        print(stderr.decode())
        sys.exit(1)
    
    return stdout.decode().strip()

def build_frontend():
    """Build React frontend"""
    print("Building React frontend...")
    run_command("npm install", cwd="frontend")
    run_command("npm run build", cwd="frontend")
    
    # Copy build to the right location
    if os.path.exists("dist/frontend"):
        shutil.rmtree("dist/frontend")
    shutil.copytree("frontend/build", "dist/frontend")

def build_backend():
    """Prepare backend for distribution"""
    print("Preparing backend...")
    
    # Create dist directory
    os.makedirs("dist/backend", exist_ok=True)
    
    # Copy backend files
    backend_files = [
        "app.py",
        "routes",
        "models",
        "services",
    ]
    
    for item in backend_files:
        src = os.path.join("backend", item)
        dst = os.path.join("dist/backend", item)
        
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
    
    # Create data directories
    os.makedirs("dist/backend/data/chats", exist_ok=True)
    
    # Copy AI toolkit
    if os.path.exists("dist/backend/ai_toolkit"):
        shutil.rmtree("dist/backend/ai_toolkit")
    shutil.copytree("backend/ai_toolkit", "dist/backend/ai_toolkit")

def create_launcher():
    """Create a launcher script for the app"""
    print("Creating launcher...")
    
    launcher_content = """#!/usr/bin/env python
import os
import sys
import subprocess
import webbrowser
import time
import signal
import threading

# Get the directory of this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

def run_backend():
    # Add backend directory to Python path
    sys.path.insert(0, BACKEND_DIR)
    
    # Import and run the Flask app
    from app import create_app
    
    app = create_app()
    app.run(host='127.0.0.1', port=5000)

def main():
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
"""
    
    with open("dist/run_app.py", "w") as f:
        f.write(launcher_content)
    
    # Make it executable on Unix
    if os.name != 'nt':  # Not Windows
        os.chmod("dist/run_app.py", 0o755)