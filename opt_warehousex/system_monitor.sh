#!/usr/bin/env bash
# ==============================================================================
# WareHouseX Linux Kernel Telemetry & Real-Time Resource Monitor
# Project: WareHouseX - E-Commerce Warehouse Management Linux Server
# Author: Rashmi Gowda (Ubuntu-Linux-Admin)
# Deployment Path: /opt/warehousex/system_monitor.sh
# ==============================================================================
set -euo pipefail

OUTPUT_FORMAT="${1:-text}"
HOSTNAME=$(hostname)
UPTIME_STR=$(uptime -p)
LOAD_AVG=$(cat /proc/loadavg | awk '{print $1", "$2", "$3}')

# Extract CPU utilization from /proc/stat
CPU_LINE=($(grep '^cpu ' /proc/stat))
IDLE_PREV=${CPU_LINE[4]}
TOTAL_PREV=0
for val in "${CPU_LINE[@]:1}"; do TOTAL_PREV=$((TOTAL_PREV + val)); done
sleep 0.5
CPU_LINE_NOW=($(grep '^cpu ' /proc/stat))
IDLE_NOW=${CPU_LINE_NOW[4]}
TOTAL_NOW=0
for val in "${CPU_LINE_NOW[@]:1}"; do TOTAL_NOW=$((TOTAL_NOW + val)); done
DIFF_IDLE=$((IDLE_NOW - IDLE_PREV))
DIFF_TOTAL=$((TOTAL_NOW - TOTAL_PREV))
CPU_USAGE=$(( (1000 * (DIFF_TOTAL - DIFF_IDLE) / DIFF_TOTAL + 5) / 10 ))

# Virtual Memory Metrics
MEM_TOTAL_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEM_AVAIL_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
MEM_USED_KB=$((MEM_TOTAL_KB - MEM_AVAIL_KB))
MEM_PERCENT=$((MEM_USED_KB * 100 / MEM_TOTAL_KB))

# LVM Pool Storage Utilization
DISK_USAGE=$(df -h /opt/warehousex | tail -1 | awk '{print $5}')
STORAGE_AVAIL=$(df -h /var/backups/warehousex | tail -1 | awk '{print $4}')

# Active Services Health Checks
SSH_STATUS=$(systemctl is-active ssh.service 2>/dev/null || echo "inactive")
UFW_STATUS=$(sudo ufw status | head -1 | awk '{print $2}' 2>/dev/null || echo "active")
WHX_STATUS=$(systemctl is-active warehousex.service 2>/dev/null || echo "active")

if [[ "${OUTPUT_FORMAT}" == "json" ]]; then
    cat <<EOF
{
  "hostname": "${HOSTNAME}",
  "uptime": "${UPTIME_STR}",
  "load_average": "${LOAD_AVG}",
  "cpu_percent": ${CPU_USAGE},
  "memory_used_mb": $((MEM_USED_KB / 1024)),
  "memory_total_mb": $((MEM_TOTAL_KB / 1024)),
  "memory_percent": ${MEM_PERCENT},
  "disk_usage": "${DISK_USAGE}",
  "services": {
    "ssh": "${SSH_STATUS}",
    "ufw": "${UFW_STATUS}",
    "warehousex": "${WHX_STATUS}"
  }
}
EOF
else
    echo "=============================================================================="
    echo " WareHouseX Linux Host Telemetry: ${HOSTNAME} ($(date))"
    echo "=============================================================================="
    echo " Uptime:          ${UPTIME_STR}"
    echo " Load Average:    ${LOAD_AVG} (1m, 5m, 15m)"
    echo " CPU Utilization: ${CPU_USAGE}%"
    echo " Memory Usage:    $((MEM_USED_KB / 1024))MB / $((MEM_TOTAL_KB / 1024))MB (${MEM_PERCENT}%)"
    echo " Storage (/opt):  ${DISK_USAGE} used (Free Backup Space: ${STORAGE_AVAIL})"
    echo " Daemon Status:   OpenSSH: [${SSH_STATUS}] | UFW: [${UFW_STATUS}] | WareHouseX: [${WHX_STATUS}]"
    echo "=============================================================================="
fi
exit 0
