from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash
from database.db import get_db
from modules.auth import token_required, role_required

employees_bp = Blueprint("employees", __name__)

def get_adapter():
    from app import system_adapter
    return system_adapter

@employees_bp.route("", methods=["GET"])
@token_required
def list_employees():
    role = request.args.get("role")
    status = request.args.get("status")
    search = request.args.get("search", "").strip()

    query = "SELECT id, username, full_name, email, role, linux_user, linux_group, status, created_at, updated_at FROM users WHERE 1=1"
    params = []

    if role:
        query += " AND role = ?"
        params.append(role)
    if status:
        query += " AND status = ?"
        params.append(status)
    if search:
        query += " AND (username LIKE ? OR full_name LIKE ? OR email LIKE ? OR linux_user LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY id ASC"

    with get_db() as conn:
        employees = conn.execute(query, params).fetchall()
        
        # Also grab Linux users overview
        linux_users = get_adapter().get_linux_users()

    return jsonify({
        "employees": employees,
        "linux_system_accounts": linux_users.get("users", []),
        "count": len(employees)
    }), 200

@employees_bp.route("", methods=["POST"])
@token_required
@role_required(["admin", "manager"])
def create_employee():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip().lower()
    password = data.get("password", "").strip()
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    role = data.get("role", "staff")
    status = data.get("status", "active")
    sync_linux = data.get("sync_linux", True)

    if not username or not password or not full_name or not email:
        return jsonify({"error": "Username, password, full name, and email are required"}), 400

    if role not in ("admin", "manager", "staff"):
        return jsonify({"error": "Role must be admin, manager, or staff"}), 400

    # Map role to Linux group
    group_map = {
        "admin": "wh-admins",
        "manager": "wh-managers",
        "staff": "wh-staff"
    }
    linux_group = group_map.get(role, "wh-staff")
    linux_user = f"whx_{username[:12]}"

    client_ip = request.remote_addr or "127.0.0.1"

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (username, email)
        ).fetchone()

        if existing:
            return jsonify({"error": "Username or email is already registered"}), 409

        password_hash = generate_password_hash(password)
        cursor = conn.execute("""
            INSERT INTO users (username, password_hash, full_name, email, role, linux_user, linux_group, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (username, password_hash, full_name, email, role, linux_user, linux_group, status))

        new_id = cursor.lastrowid

        # Linux user synchronization
        linux_sync_msg = ""
        if sync_linux:
            try:
                adapter_res = get_adapter().add_linux_user(linux_user, linux_group)
                linux_sync_msg = adapter_res.get("message", "Synchronized with Linux user database")
            except Exception as e:
                linux_sync_msg = f"Linux user sync notice: {str(e)}"

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "EMPLOYEE_CREATED", "employees", f"Created employee {username} ({role}) with Linux user {linux_user}", "info", client_ip)
        )

    return jsonify({
        "message": "Employee created successfully",
        "employee_id": new_id,
        "linux_sync": linux_sync_msg
    }), 201

@employees_bp.route("/<int:emp_id>", methods=["PUT"])
@token_required
@role_required(["admin", "manager"])
def update_employee(emp_id: int):
    data = request.get_json(silent=True) or {}
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    role = data.get("role")
    status = data.get("status")
    password = data.get("password")

    with get_db() as conn:
        emp = conn.execute("SELECT * FROM users WHERE id = ?", (emp_id,)).fetchone()
        if not emp:
            return jsonify({"error": "Employee not found"}), 404

        # Disallow non-admins from promoting to admin or editing admin accounts
        if g.current_user["role"] != "admin" and (emp["role"] == "admin" or role == "admin"):
            return jsonify({"error": "Only administrators can modify administrator accounts"}), 403

        updates = []
        params = []

        if full_name:
            updates.append("full_name = ?")
            params.append(full_name)
        if email:
            updates.append("email = ?")
            params.append(email)
        if role and role in ("admin", "manager", "staff"):
            group_map = {"admin": "wh-admins", "manager": "wh-managers", "staff": "wh-staff"}
            updates.append("role = ?")
            updates.append("linux_group = ?")
            params.append(role)
            params.append(group_map.get(role, "wh-staff"))
        if status and status in ("active", "inactive", "suspended"):
            updates.append("status = ?")
            params.append(status)
        if password:
            updates.append("password_hash = ?")
            params.append(generate_password_hash(password))

        if not updates:
            return jsonify({"message": "No fields to update"}), 200

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(emp_id)

        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "EMPLOYEE_UPDATED", "employees", f"Updated details for employee {emp['username']}", "info", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": "Employee details updated successfully"}), 200

@employees_bp.route("/<int:emp_id>", methods=["DELETE"])
@token_required
@role_required(["admin"])
def delete_employee(emp_id: int):
    with get_db() as conn:
        emp = conn.execute("SELECT id, username, role, linux_user FROM users WHERE id = ?", (emp_id,)).fetchone()
        if not emp:
            return jsonify({"error": "Employee record not found"}), 404

        if emp["id"] == g.current_user["user_id"]:
            return jsonify({"error": "You cannot delete your own active administrator account"}), 400

        # Delete from DB
        conn.execute("DELETE FROM users WHERE id = ?", (emp_id,))

        # Remove or lock Linux user
        if emp["linux_user"]:
            try:
                get_adapter().delete_linux_user(emp["linux_user"])
            except Exception as e:
                print(f"[WARN] Failed removing Linux user {emp['linux_user']}: {e}")

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "EMPLOYEE_DELETED", "employees", f"Removed employee record for {emp['username']}", "warning", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": f"Employee {emp['username']} successfully removed"}), 200
