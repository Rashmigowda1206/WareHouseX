#!/bin/bash

SOURCE="/opt/warehousex"
BACKUP_DIR="/opt/warehousex/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/warehouse_backup_$DATE.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "======================================"
echo "       WAREHOUSE BACKUP SYSTEM"
echo "======================================"

tar -czf "$BACKUP_FILE" \
    --exclude="$BACKUP_DIR" \
    "$SOURCE/inventory" \
    "$SOURCE/employees" \
    "$SOURCE/orders" \
    "$SOURCE/reports"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully!"
    echo "Backup file: $BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi

echo "======================================"
