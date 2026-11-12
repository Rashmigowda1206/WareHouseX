import os
import tempfile
from pathlib import Path

IS_VERCEL = bool(os.getenv("VERCEL"))
BASE_DIR = Path(__file__).resolve().parent

if IS_VERCEL:
    TMP_DIR = Path(tempfile.gettempdir()) / "warehousex"
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE_PATH = Path(os.getenv("WAREHOUSEX_DB_PATH", TMP_DIR / "warehousex.db"))
    BACKUPS_DIR = TMP_DIR / "backups_storage"
    DATA_VAULT_DIR = TMP_DIR / "data_vault"
    SCRIPTS_DIR = BASE_DIR / "scripts"
else:
    DATABASE_PATH = Path(os.getenv("WAREHOUSEX_DB_PATH", BASE_DIR / "warehousex.db"))
    BACKUPS_DIR = BASE_DIR / "backups_storage"
    DATA_VAULT_DIR = BASE_DIR / "data_vault"
    SCRIPTS_DIR = BASE_DIR / "scripts"

# Ensure essential runtime folders exist
BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
DATA_VAULT_DIR.mkdir(parents=True, exist_ok=True)
if not IS_VERCEL:
    SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

SECRET_KEY = os.getenv("WAREHOUSEX_SECRET_KEY", "whx_super_secret_production_key_2026_industrial")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Server operational modes: "auto", "live", "demo"
SYSTEM_MODE = "demo" if IS_VERCEL else os.getenv("WAREHOUSEX_MODE", "auto")
HOST = os.getenv("WAREHOUSEX_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("WAREHOUSEX_PORT", "5000")))
DEBUG = os.getenv("WAREHOUSEX_DEBUG", "True").lower() in ("true", "1")
