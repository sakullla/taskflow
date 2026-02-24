#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_PATH="$ROOT_DIR/deploy/nginx/conf.d/taskflow.conf.template"
OUTPUT_PATH="$ROOT_DIR/deploy/nginx/conf.d/taskflow.conf"

TLS_DOMAIN="${TLS_DOMAIN:-}"
APP_UPSTREAM="${APP_UPSTREAM:-app:${PORT:-3000}}"

if [[ -z "$TLS_DOMAIN" ]]; then
  echo "ERROR: TLS_DOMAIN is required. Example: TLS_DOMAIN=todo.example.com"
  exit 1
fi

if [[ ! -f "$TEMPLATE_PATH" ]]; then
  echo "ERROR: Template not found at $TEMPLATE_PATH"
  exit 1
fi

escape_for_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

domain_escaped="$(escape_for_sed "$TLS_DOMAIN")"
upstream_escaped="$(escape_for_sed "$APP_UPSTREAM")"

sed \
  -e "s/__TLS_DOMAIN__/$domain_escaped/g" \
  -e "s/__APP_UPSTREAM__/$upstream_escaped/g" \
  "$TEMPLATE_PATH" > "$OUTPUT_PATH"

echo "Nginx config generated:"
echo "  Domain: $TLS_DOMAIN"
echo "  Upstream: $APP_UPSTREAM"
echo "  File: $OUTPUT_PATH"
