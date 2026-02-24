#!/bin/bash

# Database setup script for different providers
# Usage: ./setup-db.sh [sqlite|postgresql|mysql]

set -e

DB_TYPE="${1:-sqlite}"
API_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Setting up database: $DB_TYPE"

export DB_TYPE
node "$API_DIR/scripts/prepare-prisma-schema.mjs"

echo "Database schema provider synchronized"
echo "Run 'npm run db:generate' to regenerate the client"
