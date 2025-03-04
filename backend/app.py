from flask import Flask
from flask_cors import CORS
import os
import sys

# Add the current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import routes
from routes.chat_routes import chat_bp
from routes.model_routes import model_bp
from routes.settings_routes import settings_bp
from routes.auth_routes import auth_bp

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
    
    # Configure app with environment variables
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['CHAT_HISTORY_DIR'] = os.environ.get('CHAT_HISTORY_DIR', 'data/chats')
    
    # Enable CORS with proper configuration
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register routes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(model_bp, url_prefix='/api/models')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    
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
    app.run(host='0.0.0.0', port=port, debug=True)