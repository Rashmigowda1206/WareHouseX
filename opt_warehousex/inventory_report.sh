#!/usr/bin/env bash
# ==============================================================================
# WareHouseX Stock Valuation & Low-Stock Alert Generator
# Project: WareHouseX - E-Commerce Warehouse Management Linux Server
# Author: Rashmi Gowda (Ubuntu-Linux-Admin)
# Deployment Path: /opt/warehousex/inventory_report.sh
# ==============================================================================
set -euo pipefail

DB_FILE="/home/rashmigowda/WareHouseX/backend/database/warehousex.db"
OUTPUT_REPORT="/home/rashmigowda/WareHouseX_Evidence/Reports/inventory_audit_$(date +%Y%m%d).txt"

echo "==============================================================================" | tee "${OUTPUT_REPORT}"
echo " WAREHOUSEX INVENTORY METRICS & STOCK AUDIT REPORT" | tee -a "${OUTPUT_REPORT}"
echo " Generated on: $(date) by user $(whoami)" | tee -a "${OUTPUT_REPORT}"
echo " Database Source: ${DB_FILE}" | tee -a "${OUTPUT_REPORT}"
echo "==============================================================================" | tee -a "${OUTPUT_REPORT}"

if [[ ! -f "${DB_FILE}" ]]; then
    echo "[ERROR] Database file not found at ${DB_FILE}" >&2
    exit 1
fi

TOTAL_PRODUCTS=$(sqlite3 "${DB_FILE}" "SELECT COUNT(*) FROM products;")
TOTAL_STOCK=$(sqlite3 "${DB_FILE}" "SELECT SUM(stock_quantity) FROM products;")
TOTAL_VALUE=$(sqlite3 "${DB_FILE}" "SELECT printf('%.2f', SUM(stock_quantity * unit_price)) FROM products;")
LOW_STOCK_COUNT=$(sqlite3 "${DB_FILE}" "SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_threshold;")

echo " Total SKUs Tracked:     ${TOTAL_PRODUCTS}" | tee -a "${OUTPUT_REPORT}"
echo " Total Physical Units:   ${TOTAL_STOCK} units" | tee -a "${OUTPUT_REPORT}"
echo " Aggregate Value:        $${TOTAL_VALUE} USD" | tee -a "${OUTPUT_REPORT}"
echo " Low-Stock Alerts:       ${LOW_STOCK_COUNT} items need replenishment" | tee -a "${OUTPUT_REPORT}"
echo "" | tee -a "${OUTPUT_REPORT}"

echo "CRITICAL ITEMS REQUIRING REORDER:" | tee -a "${OUTPUT_REPORT}"
echo "------------------------------------------------------------------------------" | tee -a "${OUTPUT_REPORT}"
printf "%-12s | %-32s | %-8s | %-12s
" "SKU" "PRODUCT NAME" "QTY" "ZONE" | tee -a "${OUTPUT_REPORT}"
echo "------------------------------------------------------------------------------" | tee -a "${OUTPUT_REPORT}"

sqlite3 "${DB_FILE}" -separator "|"     "SELECT sku, name, stock_quantity, warehouse_zone FROM products WHERE stock_quantity <= min_stock_threshold ORDER BY stock_quantity ASC;" |     while IFS="|" read -r sku name qty zone; do
        printf "%-12s | %-32s | %-8s | %-12s
" "${sku}" "${name:0:30}" "${qty}" "${zone}" | tee -a "${OUTPUT_REPORT}"
    done

echo "------------------------------------------------------------------------------" | tee -a "${OUTPUT_REPORT}"
echo "Report archived to ${OUTPUT_REPORT}"
exit 0
