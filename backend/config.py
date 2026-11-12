import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "warehousex.db"
BACKUPS_DIR = BASE_DIR / "backups_storage"
DATA_VAULT_DIR = BASE_DIR / "data_vault"
SCRIPTS_DIR = BASE_DIR / "scripts"

# Ensure essential runtime folders exist
BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
DATA_VAULT_DIR.mkdir(parents=True, exist_ok=True)
SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

SECRET_KEY = os.getenv("WAREHOUSEX_SECRET_KEY", "whx_super_secret_production_key_2026_industrial")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Server operational modes: "auto", "live", "demo"
# auto: Detects Linux kernel / bash. If unavailable, falls back to demo emulator
SYSTEM_MODE = os.getenv("WAREHOUSEX_MODE", "auto")
HOST = os.getenv("WAREHOUSEX_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("WAREHOUSEX_PORT", "5000")))
DEBUG = os.getenv("WAREHOUSEX_DEBUG", "True").lower() in ("true", "1")
