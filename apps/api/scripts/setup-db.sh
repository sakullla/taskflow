#!/bin/bash

# Database setup script for different providers
# Usage: ./setup-db.sh [sqlite|postgresql|mysql]

set -e

DB_TYPE="${1:-sqlite}"
PRISMA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/prisma"

echo "Setting up database: $DB_TYPE"

case "$DB_TYPE" in
  sqlite)
    echo "Using SQLite database"
    cp "$PRISMA_DIR/schema.prisma" "$PRISMA_DIR/schema.active.prisma"
    ;;
  postgresql|postgres|pg)
    echo "Using PostgreSQL database"
    cp "$PRISMA_DIR/schema.postgresql.prisma" "$PRISMA_DIR/schema.active.prisma"
    ;;
  mysql|mariadb)
    echo "Using MySQL database"
    cp "$PRISMA_DIR/schema.mysql.prisma" "$PRISMA_DIR/schema.active.prisma"
    ;;
  *)
    echo "Unknown database type: $DB_TYPE"
    echo "Usage: $0 [sqlite|postgresql|mysql]"
    exit 1
    ;;
esac

# Backup original schema
cp "$PRISMA_DIR/schema.prisma" "$PRISMA_DIR/schema.backup.prisma"

# Replace with selected schema
cp "$PRISMA_DIR/schema.active.prisma" "$PRISMA_DIR/schema.prisma"

echo "Database schema updated to: $DB_TYPE"
echo "Run 'npx prisma generate' to regenerate the client"
