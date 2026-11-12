import os
from flask import Flask, jsonify
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
    app = Flask(__name__)
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

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({"error": "Requested resource was not found"}), 404

    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({"error": "Internal server error occurred", "details": str(e)}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    print(f"[*] WareHouseX Backend running on http://{HOST}:{PORT}")
    print(f"[*] Operational Mode: {system_adapter.get_current_mode().upper()}")
    app.run(host=HOST, port=PORT, debug=DEBUG)
