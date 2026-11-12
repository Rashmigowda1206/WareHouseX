import re
import os
from pathlib import Path

# Strict regex patterns
USERNAME_PATTERN = re.compile(r'^[a-z_][a-z0-9_-]{2,30}$')
SERVICE_ALLOWLIST = {'ssh', 'sshd', 'ufw', 'cron', 'crond', 'nginx', 'warehousex-api', 'systemd-journald'}
BACKUP_TYPE_ALLOWLIST = {'full', 'database', 'inventory', 'config'}
SAFE_FILENAME_PATTERN = re.compile(r'^[a-zA-Z0-9_\-\.]+$')

def validate_username(username: str) -> bool:
    if not username:
        return False
    return bool(USERNAME_PATTERN.match(username))

def validate_service_name(service: str) -> bool:
    return service in SERVICE_ALLOWLIST

def validate_backup_type(backup_type: str) -> bool:
    return backup_type in BACKUP_TYPE_ALLOWLIST

def sanitize_filename(filename: str) -> str:
    """Ensure filename contains no path traversal (../ or \\)"""
    clean_name = os.path.basename(filename)
    if not SAFE_FILENAME_PATTERN.match(clean_name):
        raise ValueError(f"Unsafe filename detected: {clean_name}")
    return clean_name

def validate_safe_path(base_dir: Path, target_path: Path) -> bool:
    """Ensure target path resolves within base directory to avoid directory traversal"""
    try:
        resolved_base = base_dir.resolve()
        resolved_target = target_path.resolve()
        return str(resolved_target).startswith(str(resolved_base))
    except Exception:
        return False
