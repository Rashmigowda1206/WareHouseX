import sys
import os
import platform
from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from modules.auth import token_required, role_required
from database.db import get_db
from config import DATABASE_PATH

settings_bp = Blueprint("settings", __name__)

def get_adapter():
    from app import system_adapter
    return system_adapter

@settings_bp.route("", methods=["GET"])
@token_required
def get_settings():
    adapter = get_adapter()
    with get_db() as conn:
        settings_rows = conn.execute("SELECT setting_key, setting_value, category, description FROM system_settings").fetchall()

    settings_dict = {row["setting_key"]: row["setting_value"] for row in settings_rows}

    # Host & System Information
    db_size_kb = 0
    if os.path.exists(DATABASE_PATH):
        db_size_kb = round(os.path.getsize(DATABASE_PATH) / 1024, 1)

    system_info = {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "system": platform.system(),
        "machine": platform.machine(),
        "database_size": f"{db_size_kb} KB",
        "database_engine": "SQLite 3 (WAL mode)",
        "current_mode": adapter.get_current_mode(),
        "can_run_linux_scripts": adapter.can_execute_scripts,
        "is_linux_host": adapter.is_linux
    }

    return jsonify({
        "settings": settings_dict,
        "system_info": system_info
    }), 200

@settings_bp.route("", methods=["PUT"])
@token_required
@role_required(["admin"])
def update_settings():
    data = request.get_json(silent=True) or {}
    client_ip = request.remote_addr or "127.0.0.1"

    with get_db() as conn:
        for key, val in data.items():
            conn.execute("""
                UPDATE system_settings
                SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
                WHERE setting_key = ?
            """, (str(val), key))

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "SETTINGS_UPDATED", "settings", f"Updated system configuration parameters", "info", client_ip)
        )

    return jsonify({"message": "Settings updated successfully"}), 200

@settings_bp.route("/mode", methods=["POST"])
@token_required
@role_required(["admin"])
def toggle_mode():
    data = request.get_json(silent=True) or {}
    target_mode = data.get("mode", "auto").lower()

    if target_mode not in ("live", "demo", "auto"):
        return jsonify({"error": "Mode must be 'live', 'demo', or 'auto'"}), 400

    adapter = get_adapter()
    adapter.set_mode(target_mode)
    active_mode = adapter.get_current_mode()

    client_ip = request.remote_addr or "127.0.0.1"
    with get_db() as conn:
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "SYSTEM_MODE_SWITCHED", "system", f"Switched operational mode to {target_mode.upper()} (Resolved: {active_mode.upper()})", "warning", client_ip)
        )

    return jsonify({
        "message": f"Operational mode switched to {target_mode}",
        "current_mode": active_mode,
        "is_live": active_mode == "live"
    }), 200

@settings_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json(silent=True) or {}
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    current_password = data.get("current_password", "").strip()
    new_password = data.get("new_password", "").strip()

    user_id = g.current_user["user_id"]

    with get_db() as conn:
        user = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({"error": "User record not found"}), 404

        updates = []
        params = []

        if full_name:
            updates.append("full_name = ?")
            params.append(full_name)
        if email:
            updates.append("email = ?")
            params.append(email)

        if new_password:
            if not current_password or not check_password_hash(user["password_hash"], current_password):
                return jsonify({"error": "Current password verification failed"}), 400
            updates.append("password_hash = ?")
            params.append(generate_password_hash(new_password))

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(user_id)
            conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)

    return jsonify({"message": "Profile updated successfully"}), 200
