#!/usr/bin/env bash

# SQLite backup script with compression and retention cleanup.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

read_database_url_from_env_file() {
  local env_file="$1"
  if [[ ! -f "$env_file" ]]; then
    return 1
  fi

  local line
  line="$(grep -E '^[[:space:]]*DATABASE_URL=' "$env_file" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi

  line="${line#*=}"
  line="${line%\"}"
  line="${line#\"}"
  line="${line%\'}"
  line="${line#\'}"
  printf '%s' "$line"
}

resolve_path_from_database_url() {
  local url="$1"
  if [[ "$url" != file:* ]]; then
    return 1
  fi

  local file_path="${url#file:}"
  if [[ -z "$file_path" ]]; then
    return 1
  fi

  if [[ "$file_path" == /* ]]; then
    printf '%s' "$file_path"
    return 0
  fi

  local as_root="$ROOT_DIR/$file_path"
  local as_api="$ROOT_DIR/apps/api/$file_path"
  if [[ -f "$as_root" ]]; then
    printf '%s' "$as_root"
    return 0
  fi

  if [[ -f "$as_api" ]]; then
    printf '%s' "$as_api"
    return 0
  fi

  # Prefer root-relative for unresolved relative paths.
  printf '%s' "$as_root"
}

resolve_db_path() {
  local unresolved_from_url=""

  if [[ -n "${DB_PATH:-}" ]]; then
    printf '%s' "$DB_PATH"
    return 0
  fi

  local database_url="${DATABASE_URL:-}"
  if [[ -z "$database_url" ]]; then
    database_url="$(read_database_url_from_env_file "$ROOT_DIR/.env" || true)"
  fi
  if [[ -z "$database_url" ]]; then
    database_url="$(read_database_url_from_env_file "$ROOT_DIR/apps/api/.env" || true)"
  fi

  if [[ -n "$database_url" ]]; then
    local resolved_from_url
    resolved_from_url="$(resolve_path_from_database_url "$database_url" || true)"
    if [[ -n "$resolved_from_url" && -f "$resolved_from_url" ]]; then
      printf '%s' "$resolved_from_url"
      return 0
    fi
    unresolved_from_url="$resolved_from_url"
  fi

  local candidates=(
    "$ROOT_DIR/data/todo.db"
    "$ROOT_DIR/apps/api/data/todo.db"
    "$ROOT_DIR/apps/api/prisma/data/todo.db"
    "$ROOT_DIR/apps/api/prisma/dev.db"
  )

  local path
  for path in "${candidates[@]}"; do
    if [[ -f "$path" ]]; then
      printf '%s' "$path"
      return 0
    fi
  done

  if [[ -n "$unresolved_from_url" ]]; then
    printf '%s' "$unresolved_from_url"
    return 0
  fi

  printf '%s' "$ROOT_DIR/data/todo.db"
}

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  error "RETENTION_DAYS must be a non-negative integer, got: $RETENTION_DAYS"
  exit 1
fi

if ! command -v gzip >/dev/null 2>&1; then
  error "gzip is required but not found in PATH."
  exit 1
fi

DB_PATH="$(resolve_db_path)"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="backup_${TIMESTAMP}.db"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
COMPRESSED_PATH="$BACKUP_DIR/$COMPRESSED_FILE"

mkdir -p "$BACKUP_DIR"

if [[ ! -f "$DB_PATH" ]]; then
  error "Database file not found: $DB_PATH"
  warn "You can override database location with DB_PATH=/path/to/todo.db"
  exit 1
fi

log "Starting database backup..."
log "Source: $DB_PATH"
log "Destination: $COMPRESSED_PATH"

if command -v sqlite3 >/dev/null 2>&1; then
  log "Using sqlite3 online backup..."
  sqlite3 "$DB_PATH" ".backup '$BACKUP_PATH'"
else
  warn "sqlite3 not found, using file copy."
  cp "$DB_PATH" "$BACKUP_PATH"
fi

log "Compressing backup..."
gzip -f "$BACKUP_PATH"

if [[ -f "$COMPRESSED_PATH" ]]; then
  FILE_SIZE="$(du -h "$COMPRESSED_PATH" | cut -f1)"
  log "Backup completed successfully."
  log "File: $COMPRESSED_FILE"
  log "Size: $FILE_SIZE"
else
  error "Backup file creation failed."
  exit 1
fi

log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT="$(find "$BACKUP_DIR" -name "backup_*.db.gz" -mtime +"$RETENTION_DAYS" | wc -l | tr -d ' ')"
find "$BACKUP_DIR" -name "backup_*.db.gz" -mtime +"$RETENTION_DAYS" -delete

if [[ "$DELETED_COUNT" -gt 0 ]]; then
  log "Deleted $DELETED_COUNT old backup(s)"
else
  log "No old backups to delete"
fi

log "Recent backups:"
if compgen -G "$BACKUP_DIR/backup_*.db.gz" >/dev/null; then
  ls -lh "$BACKUP_DIR"/backup_*.db.gz | tail -5
else
  log "No backups found"
fi

log "Backup process completed."
