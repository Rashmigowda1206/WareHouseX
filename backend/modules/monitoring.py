import time
import random
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from modules.auth import token_required, role_required
from database.db import get_db

monitoring_bp = Blueprint("monitoring", __name__)

def get_adapter():
    from app import system_adapter
    return system_adapter

@monitoring_bp.route("/metrics", methods=["GET"])
@token_required
def get_live_metrics():
    adapter = get_adapter()
    metrics = adapter.get_system_metrics()
    return jsonify(metrics), 200

@monitoring_bp.route("/history", methods=["GET"])
@token_required
def get_metrics_history():
    """Generates a 12-point time-series history for charts"""
    now = time.time()
    points = []
    base_cpu = 28.0
    base_mem = 44.0

    for i in range(12, 0, -1):
        t = datetime.fromtimestamp(now - i * 5, tz=timezone.utc).strftime("%H:%M:%S")
        points.append({
            "time": t,
            "cpu": round(max(8, min(85, base_cpu + random.uniform(-10, 15))), 1),
            "memory": round(max(20, min(80, base_mem + random.uniform(-4, 6))), 1),
            "disk_io_read": round(random.uniform(5.0, 35.0), 1),
            "disk_io_write": round(random.uniform(2.0, 20.0), 1)
        })

    return jsonify({"history": points}), 200

@monitoring_bp.route("/processes", methods=["GET"])
@token_required
def get_processes():
    # Return top 10 realistic Linux server processes
    processes = [
        {"pid": 1120, "user": "whx_srv", "name": "python3 (warehousex-api)", "cpu": 4.2, "mem": 3.8, "status": "running"},
        {"pid": 840, "user": "root", "name": "systemd-journald", "cpu": 1.1, "mem": 1.2, "status": "running"},
        {"pid": 982, "user": "root", "name": "sshd: /usr/sbin/sshd -D", "cpu": 0.4, "mem": 0.6, "status": "running"},
        {"pid": 1045, "user": "root", "name": "cron: /usr/sbin/cron -f", "cpu": 0.1, "mem": 0.3, "status": "sleeping"},
        {"pid": 1289, "user": "www-data", "name": "nginx: worker process", "cpu": 1.8, "mem": 1.5, "status": "running"},
        {"pid": 450, "user": "root", "name": "kswapd0", "cpu": 0.2, "mem": 0.0, "status": "sleeping"},
        {"pid": 1540, "user": "whx_admin", "name": "bash (pts/0)", "cpu": 0.0, "mem": 0.4, "status": "sleeping"},
        {"pid": 1820, "user": "root", "name": "rsyslogd -n -iNONE", "cpu": 0.3, "mem": 0.5, "status": "running"}
    ]
    return jsonify({"processes": processes}), 200

@monitoring_bp.route("/service/<service_name>/<action>", methods=["POST"])
@token_required
@role_required(["admin"])
def manage_service(service_name: str, action: str):
    if action not in ("status", "restart", "reload"):
        return jsonify({"error": "Invalid action. Allowed: status, restart, reload"}), 400

    adapter = get_adapter()
    try:
        res = adapter.control_service(service_name, action)
    except ValueError as e:
        return jsonify({"error": str(e)}), 403

    client_ip = request.remote_addr or "127.0.0.1"
    with get_db() as conn:
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], f"SERVICE_{action.upper()}", "system", f"Executed {action} on daemon {service_name}", "warning", client_ip)
        )

    return jsonify({"message": f"Service {service_name} {action} successful", "result": res}), 200
