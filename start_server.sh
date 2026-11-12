#!/usr/bin/env bash
# ==============================================================================
# WareHouseX Production Linux Server Launcher
# ==============================================================================
set -euo pipefail

echo "=============================================================================="
echo "WAREHOUSEX: Intelligent E-Commerce Warehouse Management & Linux Server Administration"
echo "TAGLINE: Secure. Automate. Monitor. Recover."
echo "=============================================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure bash scripts are executable
chmod +x "${ROOT_DIR}/backend/scripts/"*.sh 2>/dev/null || true

# Prepare backup storage directories
mkdir -p /var/backups/warehousex 2>/dev/null || true
mkdir -p "${ROOT_DIR}/backend/backups_storage" 2>/dev/null || true

echo "[*] Initializing Python virtual environment / dependencies..."
if [[ -f "${ROOT_DIR}/venv/bin/activate" ]]; then
    source "${ROOT_DIR}/venv/bin/activate"
fi

echo "[*] Launching Flask Backend on 0.0.0.0:5000..."
python3 "${ROOT_DIR}/backend/app.py" &
BACKEND_PID=$!

echo "[*] Launching React Vite Frontend..."
cd "${ROOT_DIR}/frontend"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo ""
echo "WareHouseX services running:"
echo "  Backend API:  http://127.0.0.1:5000/api/health"
echo "  Web Frontend: http://localhost:5173"
echo "Press Ctrl+C to terminate all services."

wait
