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

def find_frontend_dir():
    """Find the frontend directory based on script location"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    
    # Try different possible locations
    possible_paths = [
        os.path.join(parent_dir, 'frontend'),
        os.path.join(script_dir, 'frontend'),
    ]
    
    for frontend_dir in possible_paths:
        if os.path.exists(frontend_dir) and os.path.exists(os.path.join(frontend_dir, 'package.json')):
            return frontend_dir
    
    print("Warning: Frontend directory with package.json not found.")
    print("Frontend will not be started automatically.")
    return None

def find_node_executable():
    """직접 Node.js 설치 여부 확인"""
    node_cmd = "node.exe" if platform.system() == "Windows" else "node"
    
    # 직접 node 명령어 검색
    node_path = shutil.which(node_cmd)
    if node_path:
        return os.path.dirname(node_path)
        
    # Windows에서 일반적인 Node.js 설치 경로 확인
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
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Set up environment
    setup_environment()
    
    # Run the Flask app using subprocess
    try:
        # Python 경로 확인
        python_executable = sys.executable
        
        # 환경 변수 설정 
        env_vars = os.environ.copy()
        env_vars["FLASK_DEBUG"] = "0"  # 디버그 모드 비활성화
        
        # 루프 작동 관련 환경 변수 설정
        env_vars["LOOP_REQUEST_TIMEOUT"] = "120"     # 루프 요청 타임아웃 설정 (seconds)
        env_vars["LOOP_MAX_TOKENS"] = "8000"         # 루프 최대 토큰 수
        env_vars["LOOP_WORKER_THREADS"] = "4"        # 루프 작업자 스레드 수
        env_vars["RESPONSE_CACHE_SIZE"] = "50"       # 응답 캐시 크기
        
        # Flask 앱 실행 명령
        backend_cmd = [python_executable, 'app.py']
        
        print(f"Running backend command: {' '.join(backend_cmd)}")
        backend_process = subprocess.Popen(
            backend_cmd,
            cwd=backend_dir,
            env=env_vars
        )
        
        return backend_process
    except Exception as e:
        print(f"Error starting backend: {e}")
        sys.exit(1)

def run_frontend():
    """Run the React frontend using npm"""
    frontend_dir = find_frontend_dir()
    if not frontend_dir:
        return None
        
    print(f"Starting frontend from {frontend_dir}")
    
    # Node.js 실행 경로 찾기
    node_dir = find_node_executable()
    
    if node_dir:
        print(f"Found Node.js installation at: {node_dir}")
        
        # PATH 환경 변수 설정
        env_vars = os.environ.copy()
        
        # Windows에서 PATH에 Node.js 경로 추가
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
                
        # npm 명령 설정
        if platform.system() == "Windows":
            npm_cmd = os.path.join(node_dir, "npm.cmd")
        else:
            npm_cmd = os.path.join(node_dir, "npm")
            
        # npm이 존재하는지 확인
        if not os.path.exists(npm_cmd):
            print(f"Warning: npm not found at expected location: {npm_cmd}")
            print("Using 'npm' command and hoping it's in PATH")
            npm_cmd = "npm"
        
        # 브라우저 자동 실행 방지
        env_vars['BROWSER'] = 'none'
        
        # npm 명령 실행
        try:
            print(f"Running: {npm_cmd} start in {frontend_dir}")
            
            if platform.system() == "Windows":
                frontend_process = subprocess.Popen(
                    [npm_cmd, "start"],
                    cwd=frontend_dir,
                    env=env_vars,
                    shell=True
                )
            else:
                frontend_process = subprocess.Popen(
                    [npm_cmd, "start"],
                    cwd=frontend_dir,
                    env=env_vars
                )
                
            return frontend_process
        except Exception as e:
            print(f"Error executing npm start: {e}")
    else:
        print("Node.js not found. Please install Node.js from https://nodejs.org/")
        
    print("\nTo start frontend manually:")
    print(f"1. Open a new terminal/command prompt")
    print(f"2. Navigate to frontend directory: cd {frontend_dir}")
    print(f"3. Run: npm start")
    return None

def main():
    """Main entry point"""
    # Check python version
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)
    
    # Find directories
    backend_dir = find_backend_dir()
    frontend_dir = find_frontend_dir()
    
    print("\n=== AI Chat App Startup ===")
    print(f"Backend directory: {backend_dir}")
    print(f"Frontend directory: {frontend_dir or 'Not found'}")
    
    # Start backend
    backend_process = run_backend()
    
    # Wait for the backend to start
    print("\nStarting backend server...")
    time.sleep(5)
    
    # Start frontend
    frontend_process = run_frontend()
    
    if frontend_process:
        print("\nStarting frontend server...")
        print("This may take a moment...")
        time.sleep(10)  # 프론트엔드가 시작하기까지 충분히 기다림
    else:
        print("\nFRONTEND NOT STARTED AUTOMATICALLY.")
        print("You'll need to start it manually in a separate terminal.")
    
    # 모든 URL 출력
    print("\n=== Access URLs ===")
    print("Backend API URL: http://localhost:5000/api")
    print("Backend UI URL: http://localhost:5000/ui")  # 백엔드에 UI가 있는 경우
    if frontend_process:
        print("Frontend URL: http://localhost:3000")
    
    # 브라우저 열기
    try:
        print("\nOpening browser...")
        
        # 프론트엔드가 실행 중이면 해당 URL 열기
        if frontend_process:
            webbrowser.open('http://localhost:3000')
        else:
            # 프론트엔드가 없으면 백엔드 UI 열기
            webbrowser.open('http://localhost:5000/ui')
            
    except Exception as e:
        print(f"브라우저를 여는데 실패했습니다: {e}")
        print("수동으로 브라우저에서 URL을 열어주세요.")
    
    print("\nAI Chat App is running.")
    print("Press Ctrl+C to exit.")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
            
            # 프로세스가 예기치 않게 종료되었는지 확인
            if backend_process.poll() is not None:
                print("Backend process terminated unexpectedly.")
                break
                
            if frontend_process and frontend_process.poll() is not None:
                print("Frontend process terminated unexpectedly.")
                # 프론트엔드가 실패해도 계속 실행
    
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        # 프로세스 정리
        if backend_process and backend_process.poll() is None:
            try:
                backend_process.terminate()
                backend_process.wait(timeout=5)
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
