# AI Chat App Packaging Guide

This guide walks you through the process of packaging the AI Chat App for distribution to others.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Python 3.8 or higher**
   - Download from [python.org](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH" during installation

2. **Node.js and npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - The LTS (Long Term Support) version is recommended

3. **PyInstaller** (will be installed automatically by the build script if missing)
   - Used to create the executable

4. **Inno Setup** (optional, for creating Windows installer)
   - Download from [jrsoftware.org/isdl.php](https://jrsoftware.org/isdl.php)
   - Install with default settings

## Building the Application

### Option 1: Automated Build (Recommended)

The easiest way to package the application is to use the provided build script:

1. Open a command prompt or PowerShell
2. Navigate to the project root directory
3. Run the build script:

```
python scripts/build_standalone.py
```

The script will:
- Check for required tools and dependencies
- Build the React frontend
- Package the application with PyInstaller
- Create either an installer (if Inno Setup is installed) or a portable ZIP file

When completed, you'll find the distribution files in the `installer` directory:
- `AI_Chat_App_Setup.exe` - Windows installer (if Inno Setup was available)
- `AI_Chat_App_Portable.zip` - Portable ZIP package (always created)

### Option 2: Manual Build Process

If you prefer to build the application manually or need more control over the process:

#### 1. Build the Frontend

```
cd frontend
npm install
npm run build
cd ..
```

#### 2. Create a PyInstaller Spec File

Create a file named `ai_chat_app.spec` in the project root with the following content:

```python
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['scripts/start_app.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('frontend/build', 'frontend/build'),
        ('backend/data', 'backend/data'),
        ('backend/ai_toolkit', 'backend/ai_toolkit'),
    ],
    hiddenimports=[
        'flask', 
        'flask_cors',
        'waitress',
        'openai',
        'anthropic',
        'google.generativeai',
        'yaml',
        'requests'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='AI Chat App',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='frontend/public/favicon.ico' if os.path.exists('frontend/public/favicon.ico') else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='AI Chat App',
)
```

#### 3. Build with PyInstaller

```
pip install pyinstaller
pyinstaller --clean ai_chat_app.spec
```

#### 4. Create an Installer (Optional)

If you have Inno Setup installed, you can create an installer manually:
1. Open Inno Setup
2. Create a new script
3. Use the "Script Wizard" to guide you through the process:
   - Application name: "AI Chat App"
   - Application folder: The `dist/AI Chat App` directory
   - Main executable: `AI Chat App.exe`
   - Output folder: `installer`

## Distributing the Application

### Using the Installer (If Created)

To distribute the application using the installer:

1. Copy the `AI_Chat_App_Setup.exe` file to your friends
2. Have them run the installer, which will:
   - Install the application to their Program Files directory
   - Create Start Menu shortcuts
   - Optionally create a desktop shortcut
   - Allow them to run the application immediately after installation

### Using the Portable ZIP

To distribute the application as a portable package:

1. Copy the `AI_Chat_App_Portable.zip` file to your friends
2. Have them extract the ZIP file to any location on their computer
3. To run the application, they should:
   - Navigate to the extracted folder
   - Run `AI Chat App.exe`

## Important Notes for Users

Make sure to inform your friends of the following:

1. **API Keys**: They will need to get their own API keys for the AI services they want to use:
   - OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Anthropic: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   - Google AI: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - xAI: From the xAI website

2. **First-Time Setup**: The first time they run the application, they'll need to enter their API keys in the settings page.

3. **Data Storage**: All their chat histories and settings will be stored locally on their computer, not on any remote server.

## Troubleshooting

If users encounter issues:

- **Application Won't Start**: Make sure they have the correct Visual C++ Redistributable installed. Direct them to download from Microsoft's website.

- **API Connection Issues**: Verify they've entered the correct API keys and have an active internet connection.

- **Missing Features**: Ensure they have entered API keys for the services corresponding to the features they want to use.

## Advanced Configuration

For advanced users who want to modify configuration:

- Settings are stored in the `data` folder within the application directory
- API keys are stored in `data/api_keys.json`
- Chat histories are stored in `data/chats`
- Loop configurations are stored in `data/loops` 