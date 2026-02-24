#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT_DIR/deploy/certs"
WEBROOT_DIR="$ROOT_DIR/deploy/certbot-www"

TLS_DOMAIN="${TLS_DOMAIN:-}"
TLS_EMAIL="${TLS_EMAIL:-}"
TLS_STAGING="${TLS_STAGING:-false}"

if [[ -z "$TLS_DOMAIN" ]]; then
  echo "ERROR: TLS_DOMAIN is required. Example: TLS_DOMAIN=todo.example.com"
  exit 1
fi

if [[ -z "$TLS_EMAIL" ]]; then
  echo "ERROR: TLS_EMAIL is required. Example: TLS_EMAIL=ops@example.com"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is required but not found in PATH."
  exit 1
fi

mkdir -p "$CERT_DIR" "$WEBROOT_DIR"

staging_arg=""
if [[ "$TLS_STAGING" == "true" ]]; then
  staging_arg="--staging"
fi

echo "Requesting certificate for $TLS_DOMAIN ..."
echo "This command needs inbound access to port 80 for HTTP challenge."

docker run --rm \
  -p 80:80 \
  -v "$CERT_DIR:/etc/letsencrypt" \
  -v "$WEBROOT_DIR:/var/www/certbot" \
  certbot/certbot:v2.11.0 certonly \
  --standalone \
  --preferred-challenges http \
  --agree-tos \
  --non-interactive \
  --email "$TLS_EMAIL" \
  -d "$TLS_DOMAIN" \
  $staging_arg

echo "Certificate request completed."
echo "Cert path: $CERT_DIR/live/$TLS_DOMAIN"
