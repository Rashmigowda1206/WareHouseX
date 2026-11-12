import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import SECRET_KEY, HOST, PORT, DEBUG, SYSTEM_MODE
from database.db import init_db
from database.seed_data import seed_database
from system_bridge.linux_adapter import LinuxAdapter

# Initialize system adapter
system_adapter = LinuxAdapter()
if SYSTEM_MODE in ("live", "demo", "auto"):
    system_adapter.set_mode(SYSTEM_MODE)

def create_app():
    FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
    app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
    app.config["SECRET_KEY"] = SECRET_KEY

    # Enable CORS for frontend Vite dev & production
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database and Seed Data
    with app.app_context():
        seed_database()

    # Register API Blueprints
    from modules.auth import auth_bp
    from modules.employees import employees_bp
    from modules.inventory import inventory_bp
    from modules.storage import storage_bp
    from modules.backups import backups_bp
    from modules.recovery import recovery_bp
    from modules.monitoring import monitoring_bp
    from modules.security import security_bp
    from modules.logs import logs_bp
    from modules.settings import settings_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(employees_bp, url_prefix="/api/employees")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(storage_bp, url_prefix="/api/storage")
    app.register_blueprint(backups_bp, url_prefix="/api/backups")
    app.register_blueprint(recovery_bp, url_prefix="/api/recovery")
    app.register_blueprint(monitoring_bp, url_prefix="/api/monitoring")
    app.register_blueprint(security_bp, url_prefix="/api/security")
    app.register_blueprint(logs_bp, url_prefix="/api/logs")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "online",
            "service": "WareHouseX Enterprise API",
            "version": "2.4.0",
            "mode": system_adapter.get_current_mode(),
            "is_linux": system_adapter.is_linux
        }), 200

    # Serve built React frontend single-page application
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"error": "Requested API route was not found"}), 404
        if path and os.path.exists(os.path.join(FRONTEND_DIST, path)):
            return send_from_directory(FRONTEND_DIST, path)
        if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
            return send_from_directory(FRONTEND_DIST, "index.html")
        return jsonify({
            "service": "WareHouseX Enterprise API",
            "status": "online",
            "message": "Frontend build not detected. Build with 'npm run build' inside frontend/"
        }), 200

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({"error": "Internal server error occurred", "details": str(e)}), 500

    return app

# WSGI Application entrypoint
app = create_app()

if __name__ == "__main__":
    print(f"[*] WareHouseX Backend running on http://{HOST}:{PORT}")
    print(f"[*] Operational Mode: {system_adapter.get_current_mode().upper()}")
    app.run(host=HOST, port=PORT, debug=DEBUG)
