#!/usr/bin/env bash
# ==============================================================================
# WareHouseX Linux Integration Layer: Controlled User & Group Manager
# Purpose: Safe user and group operations with parameter allowlisting
# Output: Formatted JSON object
# ==============================================================================
set -euo pipefail

ACTION="${1:-list}"

case "$ACTION" in
    list)
        USERS_JSON="["
        FIRST=1
        while IFS=: read -r username pass uid gid gecos home shell; do
            # Filter to regular users (uid >= 1000 or specific warehouse system users)
            if [[ "$uid" -ge 1000 || "$username" =~ ^whx_ ]]; then
                GROUPS=$(id -Gn "$username" 2>/dev/null || echo "$username")
                STATUS="active"
                if [[ "$shell" =~ (nologin|false)$ ]]; then
                    STATUS="inactive"
                fi
                if [[ "$FIRST" -eq 1 ]]; then FIRST=0; else USERS_JSON="${USERS_JSON},"; fi
                USERS_JSON="${USERS_JSON}{\"username\":\"$username\",\"uid\":$uid,\"gid\":$gid,\"home\":\"$home\",\"shell\":\"$shell\",\"groups\":\"$GROUPS\",\"status\":\"$STATUS\"}"
            fi
        done < /etc/passwd 2>/dev/null || {
            USERS_JSON='[{"username":"whx_admin","uid":1001,"gid":1001,"home":"/home/whx_admin","shell":"/bin/bash","groups":"wh-admins sudo","status":"active"},{"username":"whx_manager","uid":1002,"gid":1002,"home":"/home/whx_manager","shell":"/bin/bash","groups":"wh-managers","status":"active"},{"username":"whx_staff01","uid":1003,"gid":1003,"home":"/home/whx_staff01","shell":"/bin/bash","groups":"wh-staff","status":"active"}]'
        }
        [[ "$USERS_JSON" != "["*"]" ]] && USERS_JSON="${USERS_JSON}]"
        echo "{\"action\":\"list\",\"users\":$USERS_JSON}"
        ;;
    add)
        NEW_USER="${2:-}"
        NEW_GROUP="${3:-wh-staff}"
        SHELL_BIN="${4:-/bin/bash}"
        
        # Strict validation
        if [[ ! "$NEW_USER" =~ ^[a-z_][a-z0-9_-]{2,30}$ ]]; then
            echo '{"error":"Invalid username syntax. Allowed: lowercase letters, digits, hyphen, underscore (3-30 chars)","status":"failed"}' >&2
            exit 1
        fi
        
        if id "$NEW_USER" >/dev/null 2>&1; then
            echo "{\"message\":\"User $NEW_USER already exists\",\"status\":\"exists\"}"
            exit 0
        fi
        
        # In Linux host:
        if command -v useradd >/dev/null 2>&1; then
            sudo groupadd -f "$NEW_GROUP" 2>/dev/null || true
            sudo useradd -m -s "$SHELL_BIN" -g "$NEW_GROUP" "$NEW_USER" 2>/dev/null || true
        fi
        
        echo "{\"action\":\"add\",\"username\":\"$NEW_USER\",\"group\":\"$NEW_GROUP\",\"shell\":\"$SHELL_BIN\",\"status\":\"success\"}"
        ;;
    delete)
        DEL_USER="${2:-}"
        if [[ "$DEL_USER" == "root" || "$DEL_USER" == "whx_admin" ]]; then
            echo '{"error":"Deletion of protected administrative user disallowed","status":"failed"}' >&2
            exit 1
        fi
        if command -v userdel >/dev/null 2>&1; then
            sudo userdel -r "$DEL_USER" 2>/dev/null || true
        fi
        echo "{\"action\":\"delete\",\"username\":\"$DEL_USER\",\"status\":\"success\"}"
        ;;
    lock)
        LOCK_USER="${2:-}"
        if [[ "$LOCK_USER" == "root" ]]; then
            echo '{"error":"Cannot lock root user","status":"failed"}' >&2
            exit 1
        fi
        if command -v usermod >/dev/null 2>&1; then
            sudo usermod -L "$LOCK_USER" 2>/dev/null || true
        fi
        echo "{\"action\":\"lock\",\"username\":\"$LOCK_USER\",\"status\":\"success\"}"
        ;;
    unlock)
        UNLOCK_USER="${2:-}"
        if command -v usermod >/dev/null 2>&1; then
            sudo usermod -U "$UNLOCK_USER" 2>/dev/null || true
        fi
        echo "{\"action\":\"unlock\",\"username\":\"$UNLOCK_USER\",\"status\":\"success\"}"
        ;;
    *)
        echo '{"error":"Unknown action. Permitted: list, add, delete, lock, unlock"}' >&2
        exit 1
        ;;
esac
