# Deployment Guide

This project can be deployed in two production modes:

- HTTP-only mode with `docker-compose.yml`
- HTTPS mode with `docker-compose.yml` + `docker-compose.tls.yml` (Nginx + Let's Encrypt)

## 1) Prerequisites

- Docker
- Docker Compose
- A public domain that resolves to your host (for TLS mode)

## 2) Environment setup

```bash
cp .env.example .env
```

Set at least these values in `.env`:

- `JWT_SECRET` (required, use a strong value; >=32 chars recommended)
- `IMAGE_TAG` (for example `latest` or `v2.0.0`)
- `TZ` (IANA timezone, for example `Asia/Shanghai`)
- `CORS_ORIGINS` (comma-separated allowlist)
- `ALLOW_REGISTRATION=true|false` (set to `false` to close public signup)
  - When enabled on a fresh database, the first registered account is promoted to `admin`.
- `ENABLE_API_DOCS=false` in production

TLS mode also needs:

- `TLS_DOMAIN` (for example `todo.example.com`)
- `TLS_EMAIL` (Let's Encrypt registration email)
- `TLS_STAGING=true` for dry-run certificate requests

## 3) Deploy (HTTP-only)

```bash
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml up -d
```

Verify:

```bash
docker-compose -f docker-compose.yml ps
curl http://localhost:3000/health
```

## 4) Deploy (HTTPS with Nginx + Let's Encrypt)

### 4.1 Prepare TLS certificate and Nginx config

```bash
export TLS_DOMAIN=todo.example.com
export TLS_EMAIL=ops@example.com
bash ./scripts/request-cert.sh
bash ./scripts/render-nginx-conf.sh
```

Notes:

- Certificate request uses HTTP challenge on port 80.
- Ensure your firewall and DNS are ready before requesting certs.
- Use `TLS_STAGING=true` for non-production trial runs.

### 4.2 Start services

```bash
docker-compose -f docker-compose.yml -f docker-compose.tls.yml up -d
```

Validate:

```bash
docker-compose -f docker-compose.yml -f docker-compose.tls.yml ps
curl https://$TLS_DOMAIN/health
```

## 5) Database migration

```bash
docker-compose -f docker-compose.yml exec app npx prisma migrate deploy
```

## 6) Update / rollback

1. Update `IMAGE_TAG` in `.env`
2. Pull and restart:

```bash
docker-compose -f docker-compose.yml -f docker-compose.tls.yml pull
docker-compose -f docker-compose.yml -f docker-compose.tls.yml up -d
```

Rollback uses the same process with an older `IMAGE_TAG`.

## 7) Backup and restore (SQLite)

Create backup:

```bash
npm run backup
```

Restore example:

```bash
docker-compose -f docker-compose.yml down
docker cp ./backups/backup_YYYYMMDD_HHMMSS.db.gz taskflow-app:/app/data/
docker-compose -f docker-compose.yml up -d
```

## 8) Certificate renewal

`docker-compose.tls.yml` includes a `certbot` service that runs `certbot renew` every 12 hours.

After renewal, reload Nginx to pick up new cert files:

```bash
docker exec taskflow-nginx nginx -s reload
```

## 9) Production validation

Run post-deploy checks:

```bash
export BASE_URL=https://todo.example.com
bash ./scripts/validate-production.sh
```

See `docs/PRODUCTION_VALIDATION.md` for the full checklist.
