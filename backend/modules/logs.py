import io
import csv
from flask import Blueprint, request, jsonify, Response
from modules.auth import token_required
from database.db import get_db

logs_bp = Blueprint("logs", __name__)

@logs_bp.route("", methods=["GET"])
@token_required
def get_logs():
    module = request.args.get("module")
    severity = request.args.get("severity")
    search = request.args.get("search", "").strip()
    limit = int(request.args.get("limit", 100))

    query = "SELECT * FROM activity_logs WHERE 1=1"
    params = []

    if module and module != "all":
        query += " AND module = ?"
        params.append(module)
    if severity and severity != "all":
        query += " AND severity = ?"
        params.append(severity)
    if search:
        query += " AND (username LIKE ? OR action LIKE ? OR details LIKE ? OR ip_address LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    with get_db() as conn:
        logs = conn.execute(query, params).fetchall()

    return jsonify({"logs": logs, "count": len(logs)}), 200

@logs_bp.route("/export", methods=["GET"])
@token_required
def export_logs():
    with get_db() as conn:
        logs = conn.execute("SELECT * FROM activity_logs ORDER BY id DESC").fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "Username", "Action", "Module", "Details", "Severity", "IP Address"])
    for l in logs:
        writer.writerow([l["id"], l["timestamp"], l["username"], l["action"], l["module"], l["details"], l["severity"], l["ip_address"]])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=warehousex_audit_logs.csv"}
    )
