#!/bin/sh

# Docker startup script for Todo App
# Handles database setup and migrations

set -e

echo "================================"
echo "Starting Todo App..."
echo "================================"
echo ""

if [ -n "$DB_TYPE" ]; then
  echo "Setting up database: $DB_TYPE"
else
  echo "Setting up database: sqlite"
fi
cd /app

# Sync schema provider based on DB_TYPE/DATABASE_URL.
npm --workspace apps/api run db:prepare:schema

# Generate Prisma client for selected database
echo "Generating Prisma client..."
npm --workspace apps/api run db:generate

# Run migrations
echo "Running database migrations..."
npm --workspace apps/api run db:deploy || echo "Migration skipped (may already be applied)"
npm --workspace apps/api run db:push || echo "Schema sync skipped"

# Seed demo data only in non-production when SQLite database is empty.
if [ "$NODE_ENV" != "production" ] && { [ "$DB_TYPE" = "sqlite" ] || [ -z "$DB_TYPE" ]; }; then
  if [ ! -f /app/data/todo.db ] || [ ! -s /app/data/todo.db ]; then
    echo "Seeding database..."
    npm --workspace apps/api run db:seed || echo "Seed skipped"
  fi
fi

echo ""
echo "Starting server..."
echo "================================"

# Start the API server
exec node apps/api/dist/server.js
