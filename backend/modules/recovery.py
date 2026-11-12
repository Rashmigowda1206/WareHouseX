from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from database.db import get_db
from modules.auth import token_required, role_required

recovery_bp = Blueprint("recovery", __name__)

def get_adapter():
    from app import system_adapter
    return system_adapter

@recovery_bp.route("/available", methods=["GET"])
@token_required
def get_available_backups():
    with get_db() as conn:
        backups = conn.execute("SELECT * FROM backups WHERE status = 'completed' ORDER BY id DESC").fetchall()
    return jsonify({"available_backups": backups}), 200

@recovery_bp.route("/preflight/<filename>", methods=["GET"])
@token_required
def preflight_check(filename: str):
    adapter = get_adapter()
    try:
        res = adapter.restore_tar_backup(filename, verify_only=True)
        return jsonify({
            "status": "ready",
            "archive": filename,
            "verification": res,
            "requires_confirmation": True,
            "confirmation_keyword": "RESTORE"
        }), 200
    except Exception as e:
        return jsonify({"status": "corrupt", "error": str(e)}), 400

@recovery_bp.route("/restore", methods=["POST"])
@token_required
@role_required(["admin"])
def restore_backup():
    data = request.get_json(silent=True) or {}
    filename = data.get("filename", "").strip()
    confirmation_code = data.get("confirmation_code", "").strip()
    target_destination = data.get("target_destination", "Live Inventory & Database Vault").strip()

    # Overwrite protection requirement
    if confirmation_code != "RESTORE":
        return jsonify({
            "error": "Safety block: Disaster Recovery requires explicit confirmation. You must pass confirmation_code='RESTORE'."
        }), 400

    if not filename:
        return jsonify({"error": "Filename is required"}), 400

    adapter = get_adapter()
    client_ip = request.remote_addr or "127.0.0.1"

    with get_db() as conn:
        backup = conn.execute("SELECT * FROM backups WHERE filename = ?", (filename,)).fetchone()
        backup_id = backup["id"] if backup else None

        # Execute safe restoration
        try:
            res = adapter.restore_tar_backup(filename)
        except Exception as e:
            conn.execute("""
                INSERT INTO recovery_history (backup_id, backup_filename, restored_by, restore_target, status, log_output)
                VALUES (?, ?, ?, ?, 'failed', ?)
            """, (backup_id, filename, g.current_user["full_name"], target_destination, str(e)))
            return jsonify({"error": f"Restoration failed: {str(e)}"}), 500

        files_count = res.get("files_restored_count", 1)
        log_text = res.get("log", "Safe extraction completed without errors.")

        conn.execute("""
            INSERT INTO recovery_history (backup_id, backup_filename, restored_by, restore_target, status, files_restored_count, completed_at, log_output)
            VALUES (?, ?, ?, ?, 'success', ?, CURRENT_TIMESTAMP, ?)
        """, (backup_id, filename, g.current_user["full_name"], target_destination, files_count, log_text))

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "DISASTER_RECOVERY_EXECUTED", "recovery", f"Restored {filename} to {target_destination} ({files_count} files validated)", "critical", client_ip)
        )

    return jsonify({
        "message": f"Disaster Recovery completed successfully for {filename}",
        "details": res,
        "files_restored": files_count
    }), 200

@recovery_bp.route("/history", methods=["GET"])
@token_required
def get_recovery_history():
    with get_db() as conn:
        history = conn.execute("SELECT * FROM recovery_history ORDER BY id DESC").fetchall()
    return jsonify({"history": history}), 200
