#!/bin/bash

# Database Backup Script for Todo App
# Supports SQLite database backup with compression and rotation

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_PATH="${DB_PATH:-./apps/api/prisma/dev.db}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.db"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database file exists
if [ ! -f "$DB_PATH" ]; then
    error "Database file not found: $DB_PATH"
    exit 1
fi

log "Starting database backup..."
log "Source: $DB_PATH"
log "Destination: $BACKUP_DIR/$COMPRESSED_FILE"

# Create backup with SQLite's built-in backup command
# This ensures database integrity during backup
if command -v sqlite3 &> /dev/null; then
    log "Using sqlite3 for online backup..."
    sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/$BACKUP_FILE'"
else
    warn "sqlite3 not found, using file copy..."
    cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_FILE"
fi

# Compress the backup
log "Compressing backup..."
gzip -f "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_DIR/$COMPRESSED_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
    log "Backup completed successfully!"
    log "File: $COMPRESSED_FILE"
    log "Size: $FILE_SIZE"
else
    error "Backup file creation failed!"
    exit 1
fi

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.db.gz" -mtime +$RETENTION_DAYS | wc -l)
find "$BACKUP_DIR" -name "backup_*.db.gz" -mtime +$RETENTION_DAYS -delete

if [ "$DELETED_COUNT" -gt 0 ]; then
    log "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# List recent backups
log "Recent backups:"
ls -lh "$BACKUP_DIR"/backup_*.db.gz 2>/dev/null | tail -5 || log "No backups found"

log "Backup process completed!"
