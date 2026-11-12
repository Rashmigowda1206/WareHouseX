#!/usr/bin/env bash
# ==============================================================================
# WareHouseX Production TAR Backup & SHA-256 Cryptographic Engine
# Project: WareHouseX - E-Commerce Warehouse Management Linux Server
# Author: Rashmi Gowda (Ubuntu-Linux-Admin)
# Deployment Path: /opt/warehousex/backup_warehouse.sh
# ==============================================================================
set -euo pipefail

BACKUP_TYPE="${1:-full}"
STORAGE_VAULT="/var/backups/warehousex"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="warehousex_${BACKUP_TYPE}_${TIMESTAMP}.tar.gz"
TARGET_FILE="${STORAGE_VAULT}/${BACKUP_NAME}"
LOG_FILE="/var/log/warehousex/backup_execution.log"
APP_DIR="/home/rashmigowda/WareHouseX"
DB_PATH="${APP_DIR}/backend/database/warehousex.db"
RETENTION_DAYS=14

mkdir -p "${STORAGE_VAULT}" "/var/log/warehousex"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] Initiating ${BACKUP_TYPE} backup sequence..." | tee -a "${LOG_FILE}"

# Flush SQLite Write-Ahead Log (WAL) to prevent lock conflicts
if [[ -f "${DB_PATH}" ]]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] Flushing SQLite WAL journal checkpoint..." | tee -a "${LOG_FILE}"
    sqlite3 "${DB_PATH}" "PRAGMA wal_checkpoint(FULL);" 2>/dev/null || true
fi

# Package archive using GNU TAR with gzip compression
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] Compressing assets into POSIX TAR archive..." | tee -a "${LOG_FILE}"
case "${BACKUP_TYPE}" in
    full)
        tar -czf "${TARGET_FILE}"             -C "${APP_DIR}" backend/database/warehousex.db             -C "${APP_DIR}" backend/config.py             -C "/opt/warehousex" .             -C "/etc/systemd/system" warehousex.service             --warning=no-file-changed
        ;;
    database)
        tar -czf "${TARGET_FILE}" -C "${APP_DIR}" backend/database/warehousex.db
        ;;
    config)
        tar -czf "${TARGET_FILE}" -C "/opt/warehousex" . -C "/etc/systemd/system" warehousex.service
        ;;
    *)
        echo "[ERROR] Unknown backup target payload: ${BACKUP_TYPE}" >&2
        exit 1
        ;;
esac

# Generate SHA-256 Cryptographic Integrity Hash
SHA256_HASH=$(sha256sum "${TARGET_FILE}" | awk '{print $1}')
echo "${SHA256_HASH}  ${BACKUP_NAME}" > "${TARGET_FILE}.sha256"

# Verify archive integrity stream
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] Performing tar stream verification test (tar -tzf)..." | tee -a "${LOG_FILE}"
tar -tzf "${TARGET_FILE}" > /dev/null

ARCHIVE_SIZE=$(du -h "${TARGET_FILE}" | cut -f1)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] Backup ${BACKUP_NAME} (${ARCHIVE_SIZE}) created successfully." | tee -a "${LOG_FILE}"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SHA256] ${SHA256_HASH}" | tee -a "${LOG_FILE}"

# Automated Retention Rotation
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] Pruning backup snapshots older than ${RETENTION_DAYS} days..." | tee -a "${LOG_FILE}"
find "${STORAGE_VAULT}" -name "warehousex_*.tar.gz*" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] Backup lifecycle rotation completed." | tee -a "${LOG_FILE}"
exit 0
