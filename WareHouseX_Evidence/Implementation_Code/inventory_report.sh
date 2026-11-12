#!/bin/bash

INVENTORY="/opt/warehousex/inventory"
REPORT="/opt/warehousex/reports/inventory_report.txt"

echo "======================================"
echo "       WAREHOUSE INVENTORY REPORT"
echo "======================================"

echo ""
echo "PRODUCT STOCK DETAILS"
echo "--------------------------------------"

cat "$INVENTORY/stock.csv"

echo ""
echo "LOW STOCK ALERT (Quantity below 30)"
echo "--------------------------------------"

awk -F',' 'NR>1 && $2<30 {
    print "Product ID: " $1 " | Quantity: " $2
}' "$INVENTORY/stock.csv"

{
    echo "WAREHOUSE INVENTORY REPORT"
    echo "Generated on: $(date)"
    echo ""
    cat "$INVENTORY/stock.csv"
} > "$REPORT"

echo ""
echo "Report saved to: $REPORT"
echo "======================================"

