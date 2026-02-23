#!/bin/bash

# 数据库备份脚本
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="todo_backup_${DATE}.db"
CONTAINER_NAME="todo-api"
DB_PATH="/app/data/todo.db"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
echo "正在备份数据库..."
docker cp "${CONTAINER_NAME}:${DB_PATH}" "${BACKUP_DIR}/${BACKUP_FILE}"

# 压缩备份
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo "备份完成: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# 清理旧备份（保留最近 7 天）
find "$BACKUP_DIR" -name "todo_backup_*.db.gz" -mtime +7 -delete

echo "已清理 7 天前的备份"
