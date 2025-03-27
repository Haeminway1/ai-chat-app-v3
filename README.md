# AI Chat Application

A flexible Windows desktop application for chatting with multiple AI providers including OpenAI, Anthropic, Google, and xAI. Easily switch between different models and providers while retaining your settings and conversation history.

## Features

- **Multiple AI Provider Support**: Switch between OpenAI (GPT, O3Mini), Anthropic (Claude), Google (Gemini), and xAI (Grok) models
- **Modern UI**: Clean and responsive React interface
- **Settings Management**: Configure model settings, system prompts, and JSON output format
- **Chat History**: Save and manage multiple conversations
- **Local Storage**: All data is stored locally on your computer
- **AI Loop System**: Create conversations where multiple AI models interact with each other
- **Enhanced UX Features**:
  - Improved message input with resizable text area
  - State preservation when navigating between pages
  - Semi-transparent navigation with text labels
  - Consistent design across all pages

## Recent Updates

- **Improved Message Input for Chat**: 
  - Increased initial height to 150px for better visibility of long messages
  - Added custom resize handle at the top of the textarea for intuitive resizing
  - Enhanced styling with better visual feedback

- **Fixed Navigation Overlap Issues**: 
  - Added proper spacing to prevent navigation overlapping with content
  - Redesigned navigation bar with text labels and appropriate icons
  - Implemented semi-transparent background with blur effect
  - Improved responsive design for mobile views

- **Preserved State Between Pages**: 
  - Chat pages now remember scroll position when navigating
  - Loop page defaults to the appropriate view based on state
  - Settings page retains active tab when returning

- **Enhanced Loop Page Experience**:
  - Removed duplicate settings button
  - Improved tab navigation with clear visual indicators
  - Added animation effects for smoother transitions

## AI Loop System

The AI Loop feature allows you to create interactions between multiple AI models:

- Create loops with multiple AI participants from different providers
- Assign specific roles to each AI using customizable system prompts
- Watch AIs communicate and collaborate with each other
- Control loop flow (start, pause, resume, stop, reset)
- Reorder conversation flow to change the interaction sequence

This feature is perfect for:
- Role-playing scenarios between multiple AI personalities
- Testing how different AI models interact with each other
- Creating collaborative problem-solving sessions
- Simulating group discussions or brainstorming sessions

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
```

2. Install Python backend dependencies:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

3. Start the application:
```bash
python scripts/start_app.py
```

Your default browser will open to the application

## Setting Up API Keys

When you first start the application, you'll need to provide API keys for at least one of the supported AI providers:

- OpenAI: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Anthropic: Get your API key from [Anthropic Console](https://console.anthropic.com/settings/keys)
- Google AI: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- xAI: Get your API key from the xAI website

Your API keys are stored securely on your local machine and are never sent to any remote servers.

## Development

To set up the development environment:

1. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

3. Start the backend server:
```bash
cd backend
python app.py
```

4. Start the frontend development server:
```bash
cd frontend
npm start
```

5. Access the application at http://localhost:3000

## Building the Application

To build the desktop application:
```bash
python scripts/build_app.py
```
This will create a dist directory with the packaged application.

## License

MIT