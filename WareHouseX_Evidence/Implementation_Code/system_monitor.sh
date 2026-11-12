#!/bin/bash

REPORT="/opt/warehousex/reports/system_monitor_report.txt"

{
    echo "=========================================="
    echo "     WAREHOUSEX SYSTEM MONITORING REPORT"
    echo "=========================================="

    echo ""
    echo "Generated on: $(date)"

    echo ""
    echo "========== CPU INFORMATION =========="
    lscpu | grep -E 'Model name|CPU\(s\)|Architecture'

    echo ""
    echo "========== MEMORY USAGE =========="
    free -h

    echo ""
    echo "========== DISK USAGE =========="
    df -h /

    echo ""
    echo "========== SYSTEM UPTIME =========="
    uptime

    echo ""
    echo "========== TOP RUNNING PROCESSES =========="
    ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -n 8

    echo ""
    echo "=========================================="
    echo "          END OF MONITORING REPORT"
    echo "=========================================="

} > "$REPORT"

echo "System monitoring report generated successfully!"
echo "Report saved at: $REPORT"
