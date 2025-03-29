from flask import Flask
from flask_cors import CORS
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import routes
from routes.chat_routes import chat_bp
from routes.model_routes import model_bp
from routes.settings_routes import settings_bp
from routes.auth_routes import auth_bp
from routes.loop_routes import loop_bp  # Import the new loop blueprint

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
    
    # Configure app with environment variables
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['CHAT_HISTORY_DIR'] = os.environ.get('CHAT_HISTORY_DIR', 'data/chats')
    app.config['LOOP_HISTORY_DIR'] = os.environ.get('LOOP_HISTORY_DIR', 'data/loops')
    
    # Performance and runtime settings
    app.config['LOOP_REQUEST_TIMEOUT'] = int(os.environ.get('LOOP_REQUEST_TIMEOUT', 120))
    app.config['LOOP_MAX_TOKENS'] = int(os.environ.get('LOOP_MAX_TOKENS', 8000))
    app.config['LOOP_WORKER_THREADS'] = int(os.environ.get('LOOP_WORKER_THREADS', 4))
    app.config['RESPONSE_CACHE_SIZE'] = int(os.environ.get('RESPONSE_CACHE_SIZE', 50))
    
    logger.info(f"Runtime settings: " + 
                f"REQUEST_TIMEOUT={app.config['LOOP_REQUEST_TIMEOUT']}, " +
                f"MAX_TOKENS={app.config['LOOP_MAX_TOKENS']}, " +
                f"WORKER_THREADS={app.config['LOOP_WORKER_THREADS']}")
    
    # Enable CORS with proper configuration
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register routes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(model_bp, url_prefix='/api/models')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(loop_bp, url_prefix='/api/loop')  # Register the loop blueprint
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return {"status": "ok"}
    
    # Serve React App
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(app.static_folder + '/' + path):
            return app.send_static_file(path)
        return app.send_static_file('index.html')
    
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    # 운영 환경에서는 디버그 모드 비활성화
    debug_mode = os.environ.get('FLASK_DEBUG', '0') == '1'
    # 스레드 설정 - 루프와 채팅을 위한 충분한 스레드
    threaded = True
    
    logger.info(f"Starting Flask app on port {port} (debug={debug_mode}, threaded={threaded})")
    app.run(host='0.0.0.0', port=port, debug=debug_mode, threaded=threaded)