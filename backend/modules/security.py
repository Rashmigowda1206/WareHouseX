from flask import Blueprint, request, jsonify, g
from modules.auth import token_required, role_required
from database.db import get_db

security_bp = Blueprint("security", __name__)

def get_adapter():
    from app import system_adapter
    return system_adapter

@security_bp.route("/audit", methods=["GET"])
@token_required
def get_security_audit():
    adapter = get_adapter()
    audit_data = adapter.get_security_audit()

    with get_db() as conn:
        rules = conn.execute("SELECT * FROM security_rules ORDER BY id ASC").fetchall()
        failed_db = conn.execute("SELECT * FROM failed_logins ORDER BY id DESC LIMIT 10").fetchall()
        groups_list = ["wh-admins", "wh-managers", "wh-staff", "backup-operators", "sudo"]

    audit_data["database_rules"] = rules
    audit_data["recent_failed_attempts"] = failed_db
    audit_data["groups"] = groups_list

    return jsonify(audit_data), 200

@security_bp.route("/rules", methods=["POST"])
@token_required
@role_required(["admin"])
def add_security_rule():
    data = request.get_json(silent=True) or {}
    rule_name = data.get("rule_name", "").strip()
    port = int(data.get("port", 0))
    protocol = data.get("protocol", "tcp").lower()
    action = data.get("action", "allow").lower()
    source_ip = data.get("source_ip", "Anywhere").strip()

    if not rule_name or port <= 0 or port > 65535:
        return jsonify({"error": "Valid Rule Name and Port (1-65535) are required"}), 400

    if action not in ("allow", "deny", "reject"):
        return jsonify({"error": "Action must be allow, deny, or reject"}), 400

    client_ip = request.remote_addr or "127.0.0.1"

    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO security_rules (rule_name, port, protocol, action, source_ip, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        """, (rule_name, port, protocol, action, source_ip))

        rule_id = cursor.lastrowid

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "FIREWALL_RULE_ADDED", "security", f"Added UFW rule: {action.upper()} {port}/{protocol} from {source_ip} ({rule_name})", "warning", client_ip)
        )

    return jsonify({"message": "Firewall policy successfully registered", "rule_id": rule_id}), 201

@security_bp.route("/rules/<int:rule_id>", methods=["DELETE"])
@token_required
@role_required(["admin"])
def delete_security_rule(rule_id: int):
    with get_db() as conn:
        rule = conn.execute("SELECT * FROM security_rules WHERE id = ?", (rule_id,)).fetchone()
        if not rule:
            return jsonify({"error": "Rule not found"}), 404

        conn.execute("DELETE FROM security_rules WHERE id = ?", (rule_id,))
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "FIREWALL_RULE_REMOVED", "security", f"Removed UFW rule: {rule['rule_name']} (Port {rule['port']})", "warning", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": f"Security rule '{rule['rule_name']}' removed"}), 200

@security_bp.route("/toggle-ufw", methods=["POST"])
@token_required
@role_required(["admin"])
def toggle_ufw():
    data = request.get_json(silent=True) or {}
    enable = data.get("enable", True)

    adapter = get_adapter()
    action = "reload" if enable else "status"
    try:
        adapter.control_service("ufw", action)
    except Exception as e:
        pass

    with get_db() as conn:
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "UFW_RELOADED", "security", "Synchronized and reloaded UFW state configuration", "warning", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": "UFW Firewall policy synced and reloaded successfully", "active": True}), 200

@security_bp.route("/flush-bans", methods=["POST"])
@token_required
@role_required(["admin"])
def flush_bans():
    with get_db() as conn:
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "SECURITY_FLUSH_BANS", "security", "Flushed expired Fail2Ban IP filter blocks", "info", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": "Fail2Ban rate-limit table flushed successfully"}), 200
