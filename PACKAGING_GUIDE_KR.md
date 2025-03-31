# AI 채팅 앱 패키징 가이드

이 가이드는 AI 채팅 앱을 다른 사람들에게 배포하기 위해 패키징하는 과정을 안내합니다.

## 필수 요구사항

시작하기 전에 다음 프로그램이 설치되어 있는지 확인하세요:

1. **파이썬 3.8 이상**
   - [python.org](https://www.python.org/downloads/)에서 다운로드
   - 설치 중 "Add Python to PATH" 옵션을 반드시 체크하세요

2. **Node.js와 npm**
   - [nodejs.org](https://nodejs.org/)에서 다운로드
   - LTS(장기 지원) 버전을 권장합니다

3. **PyInstaller** (빌드 스크립트가 없을 경우 자동으로 설치됨)
   - 실행 파일 생성에 사용됩니다

4. **Inno Setup** (선택 사항, Windows 설치 프로그램 생성용)
   - [jrsoftware.org/isdl.php](https://jrsoftware.org/isdl.php)에서 다운로드
   - 기본 설정으로 설치하세요

## 애플리케이션 빌드하기

### 옵션 1: 자동화된 빌드 (권장)

애플리케이션을 패키징하는 가장 쉬운 방법은 제공된 빌드 스크립트를 사용하는 것입니다:

1. 명령 프롬프트 또는 PowerShell을 열기
2. 프로젝트 루트 디렉토리로 이동
3. 빌드 스크립트 실행:

```
python scripts/build_standalone.py
```

스크립트는 다음 작업을 수행합니다:
- 필요한 도구와 종속성 확인
- React 프론트엔드 빌드
- PyInstaller로 애플리케이션 패키징
- Inno Setup이 설치되어 있으면 설치 프로그램 생성, 그렇지 않으면 휴대용 ZIP 파일 생성

완료되면 `installer` 디렉토리에서 배포 파일을 찾을 수 있습니다:
- `AI_Chat_App_Setup.exe` - Windows 설치 프로그램 (Inno Setup이 사용 가능한 경우)
- `AI_Chat_App_Portable.zip` - 휴대용 ZIP 패키지 (항상 생성됨)

### 옵션 2: 수동 빌드 프로세스

애플리케이션을 수동으로 빌드하거나 프로세스를 더 세밀하게 제어하고 싶은 경우:

#### 1. 프론트엔드 빌드

```
cd frontend
npm install
npm run build
cd ..
```

#### 2. PyInstaller Spec 파일 생성

프로젝트 루트에 `ai_chat_app.spec`이라는 파일을 다음 내용으로 만드세요:

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

#### 3. PyInstaller로 빌드

```
pip install pyinstaller
pyinstaller --clean ai_chat_app.spec
```

#### 4. 설치 프로그램 만들기 (선택 사항)

Inno Setup이 설치되어 있는 경우 수동으로 설치 프로그램을 만들 수 있습니다:
1. Inno Setup 열기
2. 새 스크립트 생성
3. "Script Wizard"를 사용하여 프로세스 진행:
   - 응용 프로그램 이름: "AI Chat App"
   - 응용 프로그램 폴더: `dist/AI Chat App` 디렉토리
   - 메인 실행 파일: `AI Chat App.exe`
   - 출력 폴더: `installer`

## 애플리케이션 배포하기

### 설치 프로그램 사용 (생성된 경우)

설치 프로그램을 사용하여 애플리케이션을 배포하려면:

1. `AI_Chat_App_Setup.exe` 파일을 지인에게 복사
2. 지인이 설치 프로그램을 실행하면:
   - 프로그램 파일 디렉토리에 애플리케이션 설치
   - 시작 메뉴 바로 가기 생성
   - 선택적으로 바탕 화면 바로 가기 생성
   - 설치 직후 애플리케이션 실행 가능

### 휴대용 ZIP 사용

휴대용 패키지로 애플리케이션을 배포하려면:

1. `AI_Chat_App_Portable.zip` 파일을 지인에게 복사
2. 지인이 ZIP 파일을 컴퓨터의 원하는 위치에 압축 해제
3. 애플리케이션 실행 방법:
   - 압축을 푼 폴더로 이동
   - `AI Chat App.exe` 실행

## 사용자를 위한 중요 참고 사항

지인에게 다음 사항을 안내해 주세요:

1. **API 키**: 사용하고자 하는 AI 서비스에 대한 자체 API 키가 필요합니다:
   - OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Anthropic: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   - Google AI: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - xAI: xAI 웹사이트에서 확인

2. **첫 사용 설정**: 애플리케이션을 처음 실행할 때 설정 페이지에서 API 키를 입력해야 합니다.

3. **데이터 저장**: 모든 채팅 기록과 설정은 원격 서버가 아닌 사용자의 컴퓨터에 로컬로 저장됩니다.

## 문제 해결

사용자가 문제를 겪는 경우:

- **애플리케이션이 시작되지 않음**: 올바른 Visual C++ Redistributable이 설치되어 있는지 확인하세요. Microsoft 웹사이트에서 다운로드하도록 안내하세요.

- **API 연결 문제**: 올바른 API 키를 입력했는지, 인터넷 연결이 활성화되어 있는지 확인하세요.

- **기능 누락**: 사용하려는 기능에 해당하는 서비스의 API 키를 입력했는지 확인하세요.

## 고급 구성

구성을 수정하고자 하는 고급 사용자의 경우:

- 설정은 애플리케이션 디렉토리 내 `data` 폴더에 저장됨
- API 키는 `data/api_keys.json`에 저장됨
- 채팅 기록은 `data/chats`에 저장됨
- 루프 구성은 `data/loops`에 저장됨 