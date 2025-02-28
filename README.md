# AI Chat Application

A flexible Windows desktop application for chatting with multiple AI providers including OpenAI, Anthropic, and Google. Easily switch between different models and providers while retaining your settings and conversation history.

## Features

- **Multiple AI Provider Support**: Switch between OpenAI (GPT, O3Mini), Anthropic (Claude), and Google (Gemini) models
- **Modern UI**: Clean and responsive React interface
- **Settings Management**: Configure model settings, system prompts, and JSON output format
- **Chat History**: Save and manage multiple conversations
- **Local Storage**: All data is stored locally on your computer

## Requirements

- Python 3.8 or higher
- Node.js 14 or higher (for development only)
- API keys for the AI providers you want to use

## Installation

### Option 1: Using the installer (recommended)

1. Download the latest installer from the releases page
2. Run the installer and follow the instructions
3. Launch the application from your start menu or desktop

### Option 2: From source

1. Clone this repository:
```bash
git clone https://github.com/yourusername/ai-chat-app.git
cd ai-chat-app

Install Python backend dependencies:

bashCopycd backend
pip install -r requirements.txt
cd ..

Start the application:

bashCopypython scripts/start_app.py

Your default browser will open to the application

Setting Up API Keys
When you first start the application, you'll need to provide API keys for at least one of the supported AI providers:

OpenAI: Get your API key from OpenAI Platform
Anthropic: Get your API key from Anthropic Console
Google AI: Get your API key from Google AI Studio

Your API keys are stored securely on your local machine and are never sent to any remote servers.
Development
To set up the development environment:

Install backend dependencies:

bashCopycd backend
pip install -r requirements.txt
cd ..

Install frontend dependencies:

bashCopycd frontend
npm install
cd ..

Start the backend server:

bashCopycd backend
python app.py

Start the frontend development server:

bashCopycd frontend
npm start

Access the application at http://localhost:3000

Building the Application
To build the desktop application:
bashCopypython scripts/build_app.py
This will create a dist directory with the packaged application.
License
MIT
Copy
### requirements.txt
flask==2.2.3
flask-cors==3.0.10
pyyaml==6.0
openai>=1.0.0
anthropic>=0.5.0
google-generativeai>=0.2.0
requests>=2.28.0
waitress==2.1.2
Copy
### scripts/start_app.py

```python
#!/usr/bin/env python
import os
import sys
import subprocess
import webbrowser
import time
import signal
import threading

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
    """Set up environment variables"""
    # Load API keys from file if available
    api_keys_file = os.path.join(find_backend_dir(), 'data', 'api_keys.json')
    
    if os.path.exists(api_keys_file):
        import json
        with open(api_keys_file, 'r') as f:
            try:
                api_keys = json.load(f)
                for key, value in api_keys.items():
                    if value and key not in os.environ:
                        os.environ[key] = value
            except:
                print("Warning: Failed to load API keys")

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
        from app import create_app
        from waitress import serve
        
        app = create_app()
        
        # Use waitress for production, Flask dev server for development
        if os.environ.get('FLASK_ENV') == 'development':
            app.run(host='127.0.0.1', port=5000, debug=True)
        else:
            print("Starting production server with waitress")
            serve(app, host='127.0.0.1', port=5000)
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
4. Installation and Setup Instructions
To run the application, follow these steps:
Running from Source

First, clone the repository to your local machine:

bashCopygit clone https://github.com/yourusername/ai-chat-app.git
cd ai-chat-app

Install the required Python dependencies:

bashCopypip install -r requirements.txt

Start the application using the start script:

bashCopypython scripts/start_app.py

Your default web browser will open automatically to the application.
On first run, you'll need to enter at least one API key on the API Keys page.

Development Environment Setup
If you want to work on the application:

Install backend dependencies:

bashCopycd backend
pip install -r requirements.txt

Install frontend dependencies:

bashCopycd frontend
npm install

Start the backend server (in a terminal):

bashCopycd backend
python app.py

Start the frontend development server (in another terminal):

bashCopycd frontend
npm start

Access the application at http://localhost:3000 (for development) or http://localhost:5000 (for the backend API).

5. Building for Distribution
To create a distributable package:

Run the build script:

bashCopypython scripts/build_app.py

This will create a dist directory containing:

The backend code
The compiled frontend
A launcher script


You can distribute this directory or create an installer using a tool like Inno Setup:

bashCopy# Install Inno Setup compiler (Windows)
# Create installer script (scripts/installer.iss)
iscc scripts/installer.iss
6. Usage

When you first start the application, you'll need to provide API keys for the AI providers you want to use.
Once you've entered your API keys, you'll be taken to the chat interface.
Create a new chat by clicking the "New Chat" button in the sidebar.
You can switch between different AI models using the dropdown in the header.
Type your message in the input box at the bottom and press Enter or click Send.
You can access settings by clicking the gear icon in the header or sidebar.
In settings, you can configure:

JSON mode (structured responses)
System prompts for each model
Add custom system prompts



This completes the codebase for your AI Chat Application that integrates with your existing AI Toolkit. The application provides a modern, flexible interface for interacting with multiple AI providers while maintaining full control over your conversations and settings.