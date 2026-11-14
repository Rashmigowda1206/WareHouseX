import jwt
from functools import wraps
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, g
from werkzeug.security import check_password_hash, generate_password_hash
from database.db import get_db
from config import SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_HOURS

auth_bp = Blueprint("auth", __name__)

def generate_token(user_id: int, username: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Authentication token missing"}), 401

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
            g.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401

        return f(*args, **kwargs)
    return decorated

ROLE_ALIASES = {
    "admin": {"admin", "owner", "OWNER", "WAREHOUSE_MANAGER", "manager", "INVENTORY_STAFF", "DISPATCH_STAFF", "staff"},
    "owner": {"admin", "owner", "OWNER", "WAREHOUSE_MANAGER", "manager", "INVENTORY_STAFF", "DISPATCH_STAFF", "staff"},
    "OWNER": {"admin", "owner", "OWNER", "WAREHOUSE_MANAGER", "manager", "INVENTORY_STAFF", "DISPATCH_STAFF", "staff"},
    "manager": {"manager", "WAREHOUSE_MANAGER", "INVENTORY_STAFF", "DISPATCH_STAFF", "staff"},
    "WAREHOUSE_MANAGER": {"manager", "WAREHOUSE_MANAGER", "INVENTORY_STAFF", "DISPATCH_STAFF", "staff"},
    "staff": {"staff", "INVENTORY_STAFF", "DISPATCH_STAFF"},
    "INVENTORY_STAFF": {"staff", "INVENTORY_STAFF"},
    "DISPATCH_STAFF": {"staff", "DISPATCH_STAFF"},
}

def role_required(allowed_roles):
    """
    Role-based access control supporting OWNER, WAREHOUSE_MANAGER, INVENTORY_STAFF, DISPATCH_STAFF,
    as well as existing admin, manager, staff mappings.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, "current_user") or not g.current_user:
                return jsonify({"error": "Authentication required"}), 401
            
            user_role = str(g.current_user.get("role", "")).strip()
            # Expand allowed roles based on alias map
            expanded_allowed = set()
            for r in allowed_roles:
                expanded_allowed.add(r)
                expanded_allowed.add(r.lower())
                expanded_allowed.add(r.upper())

            # Check if user role matches or has higher privilege
            user_capabilities = ROLE_ALIASES.get(user_role, {user_role, user_role.lower(), user_role.upper()})
            if not user_capabilities.intersection(expanded_allowed):
                return jsonify({
                    "error": "Insufficient permissions for this operation",
                    "required_roles": allowed_roles,
                    "your_role": user_role
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    client_ip = request.remote_addr or "127.0.0.1"

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    with get_db() as conn:
        user = conn.execute(
            "SELECT id, username, password_hash, full_name, email, role, linux_user, linux_group, status FROM users WHERE username = ?",
            (username,)
        ).fetchone()

        if not user or not check_password_hash(user["password_hash"], password):
            # Record failed login
            conn.execute(
                "INSERT INTO failed_logins (username_attempted, ip_address, reason, user_agent) VALUES (?, ?, ?, ?)",
                (username, client_ip, "Invalid credentials provided", request.headers.get("User-Agent", "Unknown"))
            )
            conn.execute(
                "INSERT INTO activity_logs (username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
                (username or "unknown", "LOGIN_FAILED", "auth", f"Failed authentication attempt from {client_ip}", "warning", client_ip)
            )
            return jsonify({"error": "Invalid credentials provided"}), 401

        if user["status"] != "active":
            return jsonify({"error": f"Account is {user['status']}. Please contact system administrator."}), 403

        token = generate_token(user["id"], user["username"], user["role"])

        # Record activity log
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user["id"], user["username"], "LOGIN_SUCCESS", "auth", f"User {user['username']} logged in ({user['role']})", "success", client_ip)
        )

        user_data = {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "linux_user": user["linux_user"],
            "linux_group": user["linux_group"],
            "status": user["status"]
        }

        return jsonify({
            "message": "Authentication successful",
            "token": token,
            "user": user_data
        }), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    user_id = g.current_user["user_id"]
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, username, full_name, email, role, linux_user, linux_group, status, created_at FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"user": user}), 200

@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    client_ip = request.remote_addr or "127.0.0.1"
    with get_db() as conn:
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "LOGOUT", "auth", "User logged out of active session", "info", client_ip)
        )
    return jsonify({"message": "Successfully logged out"}), 200
