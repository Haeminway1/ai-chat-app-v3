import os
import subprocess
import sys
import shutil
import platform
import time

def run_command(command, cwd=None, capture_output=True):
    """Run a shell command and print output"""
    print(f"Running: {command}")
    
    if capture_output:
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
    else:
        # For commands where we want to see live output
        return subprocess.call(command, shell=True, cwd=cwd)

def is_tool_available(name):
    """Check if a command-line tool is available"""
    try:
        subprocess.check_call(f"{name} --version", shell=True, 
                             stdout=subprocess.DEVNULL, 
                             stderr=subprocess.DEVNULL)
        return True
    except:
        return False

def prepare_environment():
    """Check for required tools and setup environment"""
    print("\n=== Checking environment ===")
    
    # Check Python version
    py_ver = platform.python_version()
    print(f"Python version: {py_ver}")
    if tuple(map(int, py_ver.split('.'))) < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)
    
    # Check PyInstaller
    if not is_tool_available("pyinstaller"):
        print("PyInstaller not found. Installing...")
        run_command("pip install pyinstaller")
    
    # Check if Node.js is installed (for frontend build)
    if not is_tool_available("node"):
        print("Warning: Node.js not found. Required for frontend build.")
        print("Please install Node.js from https://nodejs.org/")
        choice = input("Continue anyway? (y/n): ")
        if choice.lower() != 'y':
            sys.exit(1)
    
    # Check npm
    if not is_tool_available("npm"):
        print("Warning: npm not found. Required for frontend build.")
        print("Please install Node.js from https://nodejs.org/")
        choice = input("Continue anyway? (y/n): ")
        if choice.lower() != 'y':
            sys.exit(1)
    
    print("Environment checks passed\n")

def get_app_version():
    """Get app version from package.json or use a default"""
    try:
        # Try to read version from package.json
        with open("frontend/package.json", "r") as f:
            import json
            data = json.load(f)
            return data.get("version", "1.0.0")
    except:
        return "1.0.0"

def build_frontend():
    """Build the React frontend"""
    print("\n=== Building Frontend ===")
    
    # Check if frontend directory exists
    if not os.path.exists("frontend"):
        print("Error: frontend directory not found")
        sys.exit(1)
    
    # Clean any existing build
    build_dir = "frontend/build"
    if os.path.exists(build_dir):
        print(f"Removing existing build directory: {build_dir}")
        shutil.rmtree(build_dir)
    
    # Install dependencies
    print("Installing frontend dependencies...")
    run_command("npm install", cwd="frontend", capture_output=False)
    
    # Build production version
    print("Building frontend production version...")
    run_command("npm run build", cwd="frontend", capture_output=False)
    
    # Verify build succeeded
    if not os.path.exists(build_dir):
        print("Error: Frontend build failed")
        sys.exit(1)
    
    print("Frontend build successful\n")

def build_backend_executable():
    """Build Python backend into an executable"""
    print("\n=== Building Backend Executable ===")
    
    # Get app version
    app_version = get_app_version()
    
    # Create PyInstaller spec file
    spec_path = "ai_chat_app.spec"
    
    spec_content = f"""# -*- mode: python ; coding: utf-8 -*-

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
    hooksconfig={{}},
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
    version='{app_version}',
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
"""
    
    with open(spec_path, "w") as f:
        f.write(spec_content)
    
    # Create data directories if they don't exist
    os.makedirs("backend/data/chats", exist_ok=True)
    os.makedirs("backend/data/loops", exist_ok=True)
    
    # Run PyInstaller
    print("Building executable with PyInstaller (this may take a while)...")
    run_command("pyinstaller --clean ai_chat_app.spec", capture_output=False)
    
    print("Backend executable build complete\n")

def create_installer():
    """Create an installer using NSIS or InnoSetup if available"""
    print("\n=== Creating Windows Installer ===")
    
    # Check if Inno Setup is available
    inno_setup_found = False
    inno_compiler = r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
    
    if os.path.exists(inno_compiler):
        inno_setup_found = True
        print("Inno Setup found. Creating installer...")
        
        # App version
        app_version = get_app_version()
        
        # Create Inno Setup script
        iss_path = "installer.iss"
        iss_content = f"""
#define MyAppName "AI Chat App"
#define MyAppVersion "{app_version}"
#define MyAppPublisher "Your Name"
#define MyAppURL "https://example.com/"
#define MyAppExeName "AI Chat App.exe"

[Setup]
AppId={{{{3F44E9B6-F7A1-4F99-A5D8-57B822A6E1F7}}}}
AppName={{#MyAppName}}
AppVersion={{#MyAppVersion}}
AppPublisher={{#MyAppPublisher}}
AppPublisherURL={{#MyAppURL}}
AppSupportURL={{#MyAppURL}}
AppUpdatesURL={{#MyAppURL}}
DefaultDirName={{autopf}}\\{{#MyAppName}}
DefaultGroupName={{#MyAppName}}
AllowNoIcons=yes
LicenseFile=LICENSE.txt
OutputDir=installer
OutputBaseFilename=AI_Chat_App_Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{{cm:CreateDesktopIcon}}"; GroupDescription: "{{cm:AdditionalIcons}}"; Flags: unchecked

[Files]
Source: "dist\\AI Chat App\\*"; DestDir: "{{app}}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{{group}}\\{{#MyAppName}}"; Filename: "{{app}}\\{{#MyAppExeName}}"
Name: "{{group}}\\{{cm:UninstallProgram,{{#MyAppName}}}}"; Filename: "{{uninstallexe}}"
Name: "{{commondesktop}}\\{{#MyAppName}}"; Filename: "{{app}}\\{{#MyAppExeName}}"; Tasks: desktopicon

[Run]
Filename: "{{app}}\\{{#MyAppExeName}}"; Description: "{{cm:LaunchProgram,{{#MyAppName}}}}"; Flags: nowait postinstall skipifsilent
"""
        
        # Create a dummy LICENSE.txt if it doesn't exist
        if not os.path.exists("LICENSE.txt"):
            with open("LICENSE.txt", "w") as f:
                f.write("This software is provided as-is, without any warranties of any kind.")
        
        # Write Inno Setup script
        with open(iss_path, "w") as f:
            f.write(iss_content)
        
        # Create installer output directory
        os.makedirs("installer", exist_ok=True)
        
        # Run Inno Setup compiler
        run_command(f'"{inno_compiler}" {iss_path}', capture_output=False)
        
        if os.path.exists("installer/AI_Chat_App_Setup.exe"):
            print("\nInstaller created successfully: installer/AI_Chat_App_Setup.exe")
        else:
            print("\nWarning: Installer creation may have failed")
    else:
        print("Inno Setup not found. Creating portable ZIP instead...")
        
        # Create a portable ZIP package
        import zipfile
        
        # Create output directory
        os.makedirs("dist/portable", exist_ok=True)
        
        # Create ZIP file
        zip_path = "installer/AI_Chat_App_Portable.zip"
        os.makedirs("installer", exist_ok=True)
        
        print("Creating portable ZIP package...")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk("dist/AI Chat App"):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, "dist")
                    zipf.write(file_path, arcname)
        
        print(f"\nPortable ZIP package created: {zip_path}")
    
    print("\nDistribution package creation complete")

def main():
    """Main build process"""
    start_time = time.time()
    
    print("\n========================================")
    print("      AI Chat App Build System")
    print("========================================\n")
    
    # Prepare the environment
    prepare_environment()
    
    # Build the frontend
    build_frontend()
    
    # Build the backend executable
    build_backend_executable()
    
    # Create Windows installer
    create_installer()
    
    elapsed_time = time.time() - start_time
    minutes, seconds = divmod(int(elapsed_time), 60)
    
    print(f"\nBuild completed in {minutes} minutes and {seconds} seconds")
    print("\nCheck the 'installer' directory for the distribution packages")

if __name__ == "__main__":
    main() 