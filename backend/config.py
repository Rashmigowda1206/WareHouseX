import os
import tempfile
import base64
import hashlib
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

# Qdrant Vector Database Configuration
QDRANT_STORAGE_PATH = Path(os.getenv("QDRANT_STORAGE_PATH", DATA_VAULT_DIR / "qdrant_storage"))
QDRANT_URL = os.getenv("QDRANT_URL", None)  # If provided, connects via HTTP/gRPC (e.g. http://localhost:6333)
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)
QDRANT_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "warehouse_inventory")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")
VECTOR_DIMENSION = int(os.getenv("VECTOR_DIMENSION", "384"))
QDRANT_SNAPSHOTS_DIR = BACKUPS_DIR / "qdrant_snapshots"

# Ensure essential runtime folders exist
BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
DATA_VAULT_DIR.mkdir(parents=True, exist_ok=True)
QDRANT_STORAGE_PATH.mkdir(parents=True, exist_ok=True)
QDRANT_SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
if not IS_VERCEL:
    SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

SECRET_KEY = os.getenv("WAREHOUSEX_SECRET_KEY", "whx_super_secret_production_key_2026_industrial")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Backup Encryption Key at rest (Fernet AES-256 derived from SECRET_KEY or custom env)
raw_key = os.getenv("QDRANT_BACKUP_KEY", SECRET_KEY)
QDRANT_BACKUP_KEY = base64.urlsafe_b64encode(hashlib.sha256(raw_key.encode()).digest())

# Server operational modes: "auto", "live", "demo"
SYSTEM_MODE = "demo" if IS_VERCEL else os.getenv("WAREHOUSEX_MODE", "auto")
HOST = os.getenv("WAREHOUSEX_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("WAREHOUSEX_PORT", "5000")))
DEBUG = os.getenv("WAREHOUSEX_DEBUG", "True").lower() in ("true", "1")
