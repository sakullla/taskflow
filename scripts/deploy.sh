#!/usr/bin/env bash

# Production deploy script (Docker Compose, image pull mode)
# Usage: ./scripts/deploy.sh

set -euo pipefail

COMPOSE_FILE="docker-compose.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_deps() {
  command -v docker >/dev/null 2>&1 || {
    error "Docker is not installed."
    exit 1
  }
  command -v docker-compose >/dev/null 2>&1 || {
    error "docker-compose is not installed."
    exit 1
  }
  info "Docker environment check passed."
}

load_env() {
  if [[ -f .env ]]; then
    info "Loading .env"
    export "$(grep -v '^#' .env | xargs)"
  else
    warn ".env not found, using defaults from compose."
  fi

  if [[ -z "${JWT_SECRET:-}" || "${JWT_SECRET:-}" == "change-me-in-production" ]]; then
    warn "JWT_SECRET is missing or weak. Please set a strong value for production."
  fi

  if [[ -z "${IMAGE_TAG:-}" ]]; then
    warn "IMAGE_TAG not configured, defaulting to latest."
  fi
}

pull_code() {
  if [[ -d .git ]]; then
    info "Pulling latest code from main..."
    git pull origin main || warn "git pull failed, continue with current checkout."
  fi
}

deploy() {
  info "Pulling images..."
  docker-compose -f "${COMPOSE_FILE}" pull

  info "Starting services..."
  docker-compose -f "${COMPOSE_FILE}" up -d
}

migrate() {
  info "Waiting for app to become healthy..."
  until docker-compose -f "${COMPOSE_FILE}" exec -T app wget -q --spider http://localhost:3000/health; do
    sleep 2
  done

  info "Running Prisma migrations..."
  docker-compose -f "${COMPOSE_FILE}" exec -T app npx prisma migrate deploy || warn "Migration failed."
}

health_check() {
  info "Running health checks..."

  curl -sf http://localhost/health >/dev/null || {
    error "Health endpoint check failed."
    return 1
  }

  curl -sf http://localhost/ >/dev/null || {
    error "Web entry check failed."
    return 1
  }

  info "All services are healthy."
}

cleanup() {
  info "Pruning unused Docker cache..."
  docker system prune -f --volumes=false
}

show_info() {
  echo ""
  echo "========================================"
  echo "Deploy completed."
  echo "========================================"
  echo "App: http://localhost"
  echo "API: http://localhost/api"
  echo ""
  echo "Useful commands:"
  echo "  docker-compose -f ${COMPOSE_FILE} logs -f"
  echo "  docker-compose -f ${COMPOSE_FILE} down"
  echo "  docker-compose -f ${COMPOSE_FILE} restart"
}

main() {
  cd "$(dirname "$0")/.."
  check_deps
  load_env
  pull_code
  deploy
  migrate
  health_check
  cleanup
  show_info
}

main "$@"
