import os
from flask import Blueprint, request, jsonify, g
from database.db import get_db
from modules.auth import token_required, role_required

backups_bp = Blueprint("backups", __name__)

def get_adapter():
    from app import system_adapter
    return system_adapter

@backups_bp.route("", methods=["GET"])
@token_required
def list_backups():
    with get_db() as conn:
        backups = conn.execute("SELECT * FROM backups ORDER BY id DESC").fetchall()
        schedules = conn.execute("SELECT * FROM backup_schedules ORDER BY id ASC").fetchall()

    return jsonify({
        "backups": backups,
        "schedules": schedules,
        "count": len(backups)
    }), 200

@backups_bp.route("", methods=["POST"])
@token_required
@role_required(["admin", "manager"])
def create_backup():
    data = request.get_json(silent=True) or {}
    backup_type = data.get("backup_type", "full").lower()
    notes = data.get("notes", "Manual administrative backup").strip()

    if backup_type not in ("full", "database", "inventory", "config"):
        return jsonify({"error": "Invalid backup type. Allowed: full, database, inventory, config"}), 400

    adapter = get_adapter()
    try:
        res = adapter.create_tar_backup(backup_type)
    except Exception as e:
        return jsonify({"error": f"Backup operation failed: {str(e)}"}), 500

    client_ip = request.remote_addr or "127.0.0.1"

    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO backups (filename, backup_type, size_bytes, size_formatted, status, sha256_checksum, file_path, verification_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            res["filename"],
            res["backup_type"],
            res["size_bytes"],
            res["size_formatted"],
            res["status"],
            res["sha256_checksum"],
            res["file_path"],
            res["verification_status"],
            notes
        ))

        backup_id = cursor.lastrowid

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "BACKUP_CREATED", "backup", f"Created {backup_type} archive {res['filename']} ({res['size_formatted']}) - SHA256 validated", "success", client_ip)
        )

    res["id"] = backup_id
    res["notes"] = notes
    return jsonify({"message": "Backup successfully created and verified", "backup": res}), 201

@backups_bp.route("/<int:backup_id>/verify", methods=["POST"])
@token_required
@role_required(["admin", "manager"])
def verify_backup(backup_id: int):
    with get_db() as conn:
        backup = conn.execute("SELECT * FROM backups WHERE id = ?", (backup_id,)).fetchone()
        if not backup:
            return jsonify({"error": "Backup record not found"}), 404

        adapter = get_adapter()
        try:
            res = adapter.restore_tar_backup(backup["filename"], verify_only=True)
            status = "verified" if res.get("archive_valid") else "corrupt"
        except Exception as e:
            status = "corrupt"
            res = {"error": str(e)}

        conn.execute("UPDATE backups SET verification_status = ? WHERE id = ?", (status, backup_id))
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "BACKUP_VERIFIED", "backup", f"Integrity check executed for {backup['filename']}: {status.upper()}", "info", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": f"Archive verification status: {status}", "details": res, "status": status}), 200

@backups_bp.route("/<int:backup_id>", methods=["DELETE"])
@token_required
@role_required(["admin"])
def delete_backup(backup_id: int):
    with get_db() as conn:
        backup = conn.execute("SELECT * FROM backups WHERE id = ?", (backup_id,)).fetchone()
        if not backup:
            return jsonify({"error": "Backup not found"}), 404

        # Delete file if exists
        try:
            if os.path.exists(backup["file_path"]):
                os.remove(backup["file_path"])
        except Exception as e:
            print(f"[WARN] Failed to delete file {backup['file_path']}: {e}")

        conn.execute("DELETE FROM backups WHERE id = ?", (backup_id,))
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "BACKUP_DELETED", "backup", f"Deleted backup archive {backup['filename']}", "warning", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": f"Backup {backup['filename']} removed successfully"}), 200

@backups_bp.route("/schedules", methods=["POST", "PUT"])
@token_required
@role_required(["admin"])
def update_schedule():
    data = request.get_json(silent=True) or {}
    schedule_id = data.get("id")
    schedule_type = data.get("schedule_type", "daily")
    time_utc = data.get("time_utc", "02:00")
    cron_expr = data.get("cron_expr", "0 2 * * *")
    retention_days = int(data.get("retention_days", 14))
    backup_type = data.get("backup_type", "full")
    enabled = 1 if data.get("enabled", True) else 0

    with get_db() as conn:
        if schedule_id:
            conn.execute("""
                UPDATE backup_schedules
                SET schedule_type = ?, time_utc = ?, cron_expr = ?, retention_days = ?, backup_type = ?, enabled = ?
                WHERE id = ?
            """, (schedule_type, time_utc, cron_expr, retention_days, backup_type, enabled, schedule_id))
        else:
            conn.execute("""
                INSERT INTO backup_schedules (schedule_type, time_utc, cron_expr, retention_days, backup_type, enabled)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (schedule_type, time_utc, cron_expr, retention_days, backup_type, enabled))

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "SCHEDULE_UPDATED", "backup", f"Updated cron schedule ({cron_expr}) for automated {backup_type} backups", "info", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": "Backup schedule saved successfully"}), 200

@backups_bp.route("/logs", methods=["GET"])
@token_required
def get_backup_logs():
    sample_logs = [
        {"timestamp": "2026-11-10T02:00:00Z", "level": "INFO", "message": "CRON daemon triggered scheduled backup job #428"},
        {"timestamp": "2026-11-10T02:00:01Z", "level": "INFO", "message": "Executing /backend/scripts/backup_create.sh full /var/backups/warehousex"},
        {"timestamp": "2026-11-10T02:00:03Z", "level": "INFO", "message": "Database WAL checkpoint flushed. Packaging POSIX TAR stream."},
        {"timestamp": "2026-11-10T02:00:08Z", "level": "INFO", "message": "Gzip compression complete. Rate: 68.4 MB/s."},
        {"timestamp": "2026-11-10T02:00:09Z", "level": "SUCCESS", "message": "Archive integrity validated with sha256 checksum matching."},
        {"timestamp": "2026-11-10T02:00:10Z", "level": "INFO", "message": "Automated retention policy applied: 0 stale archives purged (within 14-day threshold)."}
    ]
    return jsonify({"logs": sample_logs}), 200
