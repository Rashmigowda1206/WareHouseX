import sys
import os
import shutil
import tempfile
from pathlib import Path

# Set Vercel environment flags
os.environ["VERCEL"] = "1"
os.environ["WAREHOUSEX_MODE"] = "demo"

# Add backend directory to sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Copy pre-seeded database to writable /tmp directory
tmp_dir = os.path.join(tempfile.gettempdir(), "warehousex")
os.makedirs(tmp_dir, exist_ok=True)
tmp_db = os.path.join(tmp_dir, "warehousex.db")
src_db = os.path.join(BACKEND_DIR, "warehousex.db")

if not os.path.exists(tmp_db) and os.path.exists(src_db):
    try:
        shutil.copy(src_db, tmp_db)
    except Exception:
        pass

os.environ["WAREHOUSEX_DB_PATH"] = tmp_db

from app import app
