# Deployment Guide

This project is deployed as a single Docker image:

- Image: `sakullla/taskflow:<tag>`
- Compose file: `docker-compose.yml` (repository root)
- Service name: `app`
- Exposed port: `3000` by default

## 1) Prerequisites

- Docker
- Docker Compose

## 2) Environment setup

Copy environment template:

```bash
cp .env.example .env
```

Set at least:

- `JWT_SECRET` (required, use a strong random value)
- `IMAGE_TAG` (for example `latest` or `v2.0.0`)
- `APP_PORT` if you do not want `3000`

## 3) Deploy

```bash
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml up -d
```

Check status and logs:

```bash
docker-compose -f docker-compose.yml ps
docker-compose -f docker-compose.yml logs -f
```

Health check:

```bash
curl http://localhost:3000/health
```

## 4) Database migration

Run Prisma migrations in container:

```bash
docker-compose -f docker-compose.yml exec app npx prisma migrate deploy
```

## 5) Update / rollback

Update to a new image tag:

1. Change `IMAGE_TAG` in `.env`
2. Pull and restart:

```bash
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml up -d
```

Rollback is the same process with an older `IMAGE_TAG`.

## 6) Backup and restore (SQLite)

Create backup:

```bash
docker-compose -f docker-compose.yml exec app sh -c 'cp /app/data/todo.db /app/data/backup-$(date +%Y%m%d-%H%M%S).db'
```

Copy backup to host:

```bash
docker cp taskflow-app:/app/data/backup-20260101-000000.db ./backup/
```

Restore:

```bash
docker-compose -f docker-compose.yml down
docker cp ./backup/todo.db taskflow-app:/app/data/todo.db
docker-compose -f docker-compose.yml up -d
```

## 7) TLS/HTTPS recommendation

The container itself serves HTTP. For production HTTPS:

- Put a reverse proxy in front (Caddy/Nginx/Traefik)
- Terminate TLS at proxy
- Forward traffic to `http://app:3000` (or host `localhost:3000`)

If you already use Cloudflare/Ingress, terminate TLS there.

