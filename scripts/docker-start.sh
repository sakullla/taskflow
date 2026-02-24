#!/bin/sh

# Docker startup script for Todo App
# Handles database setup and migrations

set -e

echo "================================"
echo "Starting Todo App..."
echo "================================"
echo ""

# Setup database based on DB_TYPE
if [ -n "$DB_TYPE" ]; then
  echo "Setting up database: $DB_TYPE"
  cd /app/api

  case "$DB_TYPE" in
    postgresql|postgres|pg)
      echo "Using PostgreSQL"
      cp prisma/schema.postgresql.prisma prisma/schema.prisma
      ;;
    mysql)
      echo "Using MySQL"
      cp prisma/schema.mysql.prisma prisma/schema.prisma
      ;;
    *)
      echo "Using SQLite (default)"
      ;;
  esac

  # Generate Prisma client for selected database
  echo "Generating Prisma client..."
  npx prisma generate

  # Run migrations
  echo "Running database migrations..."
  npx prisma migrate deploy || echo "Migration skipped (may already be applied)"

  # Seed database if empty (SQLite only)
  if [ "$DB_TYPE" = "sqlite" ] || [ -z "$DB_TYPE" ]; then
    if [ ! -f /app/data/todo.db ] || [ ! -s /app/data/todo.db ]; then
      echo "Seeding database..."
      npx prisma db seed || echo "Seed skipped"
    fi
  fi
fi

echo ""
echo "Starting server..."
echo "================================"

# Start the API server
cd /app/api
exec node dist/server.js
